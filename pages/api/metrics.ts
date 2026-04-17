import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface QueryLog {
  timestamp: string;
  model_used: string;
  actual_cost: number;
  latency_ms: number;
  difficulty_score: number;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const days = parseInt(req.query.days as string) || 1;
    const logsFile = path.join(process.cwd(), '.logs', 'queries.json');

    if (!fs.existsSync(logsFile)) {
      return res.status(200).json({
        period_days: days,
        generated_at: new Date().toISOString(),
        total_queries: 0,
        total_cost: 0,
        model_distribution: { cheap: 0, midtier: 0, expert: 0 },
        average_difficulty: 0,
        average_latency_ms: 0,
        average_cost_per_query: 0,
      });
    }

    const allLogs: QueryLog[] = JSON.parse(fs.readFileSync(logsFile, 'utf-8'));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const logs = allLogs.filter(
      log => new Date(log.timestamp) >= cutoffDate
    );

    const totalCost = logs.reduce((sum, log) => sum + log.actual_cost, 0);
    const avgDifficulty =
      logs.length > 0
        ? logs.reduce((sum, log) => sum + log.difficulty_score, 0) / logs.length
        : 0;
    const avgLatency =
      logs.length > 0
        ? logs.reduce((sum, log) => sum + log.latency_ms, 0) / logs.length
        : 0;

    const modelDistribution = {
      cheap: logs.filter(l => l.model_used === 'gpt-3.5-turbo').length,
      midtier: logs.filter(l => l.model_used === 'gpt-4-turbo-preview').length,
      expert: logs.filter(l => l.model_used === 'gpt-4').length,
    };

    res.status(200).json({
      period_days: days,
      generated_at: new Date().toISOString(),
      total_queries: logs.length,
      total_cost: parseFloat(totalCost.toFixed(6)),
      model_distribution: modelDistribution,
      average_difficulty: parseFloat(avgDifficulty.toFixed(3)),
      average_latency_ms: parseFloat(avgLatency.toFixed(2)),
      average_cost_per_query: parseFloat(
        (logs.length > 0 ? totalCost / logs.length : 0).toFixed(6)
      ),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}