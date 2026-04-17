import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface QueryLog {
  timestamp: string;
  user_id: string;
  query: string;
  model_used: string;
  difficulty_score: number;
  tokens_input: number;
  tokens_output: number;
  actual_cost: number;
  latency_ms: number;
}

const logsDir = path.join(process.cwd(), '.logs');
const logsFile = path.join(logsDir, 'queries.json');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

if (!fs.existsSync(logsFile)) {
  fs.writeFileSync(logsFile, JSON.stringify([], null, 2));
}

function logQuery(log: QueryLog): void {
  try {
    const logs = JSON.parse(fs.readFileSync(logsFile, 'utf-8'));
    logs.push(log);
    fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error logging query:', error);
  }
}

function getDailyBudget(): any {
  const dailyBudget = parseFloat(process.env.DAILY_BUDGET || '20');
  try {
    const logs: QueryLog[] = JSON.parse(fs.readFileSync(logsFile, 'utf-8'));
    const today = new Date().toISOString().split('T')[0];
    const todaySpent = logs.filter((log) => log.timestamp.startsWith(today)).reduce((sum, log) => sum + log.actual_cost, 0);
    return {
      daily_budget: dailyBudget,
      daily_spent: parseFloat(todaySpent.toFixed(6)),
      daily_remaining: parseFloat((dailyBudget - todaySpent).toFixed(6)),
      budget_used_percentage: parseFloat(((todaySpent / dailyBudget) * 100).toFixed(4)),
    };
  } catch (error) {
    return { daily_budget: dailyBudget, daily_spent: 0, daily_remaining: dailyBudget, budget_used_percentage: 0 };
  }
}

function predictDifficulty(query: string): number {
  let score = 0;
  if (query.length < 20) score += 0.1;
  else if (query.length < 50) score += 0.3;
  else if (query.length < 100) score += 0.5;
  else if (query.length < 200) score += 0.7;
  else score += 0.9;
  const complexKeywords = ['analyze', 'compare', 'explain', 'implement', 'optimize', 'design'];
  const keywordCount = complexKeywords.filter((kw) => query.toLowerCase().includes(kw)).length;
  score += keywordCount * 0.1;
  return Math.min(score, 1);
}

function selectModel(difficulty: number): any {
  if (difficulty < 0.3) {
    return { model: 'gpt-3.5-turbo', display_name: 'GPT-3.5 Turbo', cost_per_1k_input: 0.0005, cost_per_1k_output: 0.0015, reason: 'Simple query - using fast, economical model' };
  } else if (difficulty < 0.7) {
    return { model: 'gpt-4-turbo-preview', display_name: 'GPT-4 Turbo', cost_per_1k_input: 0.01, cost_per_1k_output: 0.03, reason: 'Moderate complexity - using balanced model' };
  } else {
    return { model: 'gpt-4', display_name: 'GPT-4', cost_per_1k_input: 0.03, cost_per_1k_output: 0.06, reason: 'Complex query - using expert model' };
  }
}

function getMockResponse(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi')) return 'Hello! I am an AI assistant. How can I help you today?';
  if (lower.includes('quantum')) return 'Quantum computing uses quantum bits (qubits) to process information in superposition states, allowing parallel computation. Quantum entanglement enables quantum cryptography through QKD protocols. This has major implications for breaking current encryption methods and creating quantum-safe cryptography.';
  if (lower.includes('machine learning')) return 'Machine Learning is a subset of AI that enables systems to learn from data without explicit programming. It involves training models on datasets to recognize patterns and make predictions. Common algorithms include neural networks, decision trees, and support vector machines.';
  if (lower.includes('what is')) return 'A comprehensive explanation of that concept. It involves understanding fundamental principles, real-world applications, and current research developments. This field continues to evolve with new breakthroughs regularly.';
  return 'Your query has been processed. The system analyzed the complexity and routed it appropriately. Based on the difficulty score and available models, this response was generated to provide you with relevant information.';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, user_id } = req.body;
    if (!query || !user_id) return res.status(400).json({ error: 'Missing query or user_id' });

    const budget = getDailyBudget();
    const difficulty = predictDifficulty(query);
    const modelConfig = selectModel(difficulty);
    const estimatedInputTokens = Math.ceil(query.length / 4);
    const estimatedOutputTokens = 150;
    const estimatedCost = (estimatedInputTokens / 1000) * modelConfig.cost_per_1k_input + (estimatedOutputTokens / 1000) * modelConfig.cost_per_1k_output;

    const response_text = getMockResponse(query);
    const tokens_input = estimatedInputTokens;
    const tokens_output = Math.ceil(response_text.length / 4);
    const actual_cost = (tokens_input / 1000) * modelConfig.cost_per_1k_input + (tokens_output / 1000) * modelConfig.cost_per_1k_output;
    const latency = Math.floor(Math.random() * 400) + 100;

    logQuery({ timestamp: new Date().toISOString(), user_id, query, model_used: modelConfig.model, difficulty_score: difficulty, tokens_input, tokens_output, actual_cost, latency_ms: latency });

    const updatedBudget = getDailyBudget();

    res.status(200).json({
      response: response_text,
      model_used: modelConfig.display_name,
      routing_decision: { selected_model: modelConfig.model, model_display_name: modelConfig.display_name, difficulty_score: parseFloat(difficulty.toFixed(3)), estimated_cost: parseFloat(estimatedCost.toFixed(6)), actual_cost: parseFloat(actual_cost.toFixed(6)), budget_remaining: parseFloat(updatedBudget.daily_remaining.toFixed(6)), reason: modelConfig.reason, timestamp: new Date().toISOString() },
      tokens_used: { input: tokens_input, output: tokens_output, total: tokens_input + tokens_output },
      actual_cost: parseFloat(actual_cost.toFixed(6)),
      latency_ms: latency,
      budget_status: { daily_budget: updatedBudget.daily_budget, daily_spent: updatedBudget.daily_spent, daily_remaining: updatedBudget.daily_remaining, usage_percentage: updatedBudget.budget_used_percentage },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal error', details: error instanceof Error ? error.message : 'Unknown' });
  }
}
