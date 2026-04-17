import { AnalyticsLog, QueryResponse } from '@/src/types';
import fs from 'fs';
import path from 'path';

export class AnalyticsLogger {
  private logFile = path.join(process.cwd(), 'logs', 'analytics.jsonl');

  constructor() {
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const dir = path.dirname(this.logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  logQuery(userId: string, query: string, response: QueryResponse): void {
    const log: AnalyticsLog = {
      timestamp: new Date().toISOString(),
      user_id: userId,
      query,
      model_used: response.model_used,
      difficulty_score: response.routing_decision.difficulty_score,
      cost: response.actual_cost,
      tokens_input: response.tokens_used.input,
      tokens_output: response.tokens_used.output,
      latency_ms: response.latency_ms,
      routing_reason: response.routing_decision.reason,
    };

    fs.appendFileSync(this.logFile, JSON.stringify(log) + '\n');
  }

  getAnalytics(days: number = 7): any {
    if (!fs.existsSync(this.logFile)) {
      return { 
        error: 'No logs found', 
        total_queries: 0, 
        total_cost: 0,
        model_distribution: { cheap: 0, midtier: 0, expert: 0 },
        average_difficulty: 0,
        average_latency_ms: 0,
        average_cost_per_query: 0
      };
    }

    const logs = fs
      .readFileSync(this.logFile, 'utf-8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null);

    if (logs.length === 0) {
      return { 
        error: 'No recent logs', 
        total_queries: 0, 
        total_cost: 0,
        model_distribution: { cheap: 0, midtier: 0, expert: 0 },
        average_difficulty: 0,
        average_latency_ms: 0,
        average_cost_per_query: 0
      };
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate);

    if (recentLogs.length === 0) {
      return { 
        error: 'No logs in specified period', 
        total_queries: 0, 
        total_cost: 0,
        model_distribution: { cheap: 0, midtier: 0, expert: 0 },
        average_difficulty: 0,
        average_latency_ms: 0,
        average_cost_per_query: 0
      };
    }

    const stats = {
      total_queries: recentLogs.length,
      total_cost: parseFloat(recentLogs.reduce((sum, log) => sum + log.cost, 0).toFixed(6)),
      model_distribution: {
        cheap: recentLogs.filter(log => log.model_used === 'cheap').length,
        midtier: recentLogs.filter(log => log.model_used === 'midtier').length,
        expert: recentLogs.filter(log => log.model_used === 'expert').length,
      },
      average_difficulty: parseFloat((recentLogs.reduce((sum, log) => sum + log.difficulty_score, 0) / recentLogs.length).toFixed(4)),
      average_latency_ms: parseFloat((recentLogs.reduce((sum, log) => sum + log.latency_ms, 0) / recentLogs.length).toFixed(2)),
      average_cost_per_query: parseFloat((recentLogs.reduce((sum, log) => sum + log.cost, 0) / recentLogs.length).toFixed(6)),
    };

    return stats;
  }
}