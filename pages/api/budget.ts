import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface QueryLog {
  timestamp: string;
  actual_cost: number;
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
    const logsFile = path.join(process.cwd(), '.logs', 'queries.json');

    const dailyBudget = parseFloat(process.env.DAILY_BUDGET || '20');
    const monthlyBudget = parseFloat(process.env.MONTHLY_BUDGET || '500');

    let dailySpent = 0;
    let monthlySpent = 0;

    // Read logs
    if (fs.existsSync(logsFile)) {
      const logs: QueryLog[] = JSON.parse(fs.readFileSync(logsFile, 'utf-8'));
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      dailySpent = logs
        .filter(log => log.timestamp.startsWith(today))
        .reduce((sum, log) => sum + log.actual_cost, 0);

      monthlySpent = logs
        .filter(log => log.timestamp.startsWith(thisMonth))
        .reduce((sum, log) => sum + log.actual_cost, 0);
    }

    res.status(200).json({
      monthly_budget: monthlyBudget,
      monthly_spent: parseFloat(monthlySpent.toFixed(6)),
      monthly_remaining: parseFloat((monthlyBudget - monthlySpent).toFixed(6)),
      daily_budget: dailyBudget,
      daily_spent: parseFloat(dailySpent.toFixed(6)),
      daily_remaining: parseFloat((dailyBudget - dailySpent).toFixed(6)),
      budget_used_percentage: parseFloat(((dailySpent / dailyBudget) * 100).toFixed(4)),
      last_reset: new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get budget',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}