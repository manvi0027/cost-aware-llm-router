import { BudgetStatus } from '@/src/types';
import budgetConfig from '@/config/budget.json';
import fs from 'fs';
import path from 'path';

export class BudgetManager {
  private budgetFile = path.join(process.cwd(), 'data', 'budget.json');

  async initializeBudgetFile(): Promise<void> {
    const dir = path.dirname(this.budgetFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.budgetFile)) {
      const initialBudget = {
        daily_spent: 0,
        weekly_spent: 0,
        monthly_spent: 0,
        last_daily_reset: new Date().toISOString(),
        last_weekly_reset: new Date().toISOString(),
        last_monthly_reset: new Date().toISOString(),
      };
      fs.writeFileSync(this.budgetFile, JSON.stringify(initialBudget, null, 2));
    }
  }

  async getBudgetStatus(): Promise<BudgetStatus> {
    await this.initializeBudgetFile();

    const budgetData = JSON.parse(fs.readFileSync(this.budgetFile, 'utf-8'));
    const today = new Date().toDateString();

    // Reset if new day
    if (new Date(budgetData.last_daily_reset).toDateString() !== today) {
      budgetData.daily_spent = 0;
      budgetData.last_daily_reset = new Date().toISOString();
      fs.writeFileSync(this.budgetFile, JSON.stringify(budgetData, null, 2));
    }

    const monthlyBudget = budgetConfig.budget_policies.monthly_budget_usd;
    const dailyBudget = budgetConfig.budget_policies.daily_budget_usd;

    return {
      monthly_budget: monthlyBudget,
      monthly_spent: budgetData.monthly_spent,
      monthly_remaining: monthlyBudget - budgetData.monthly_spent,
      daily_budget: dailyBudget,
      daily_spent: budgetData.daily_spent,
      daily_remaining: dailyBudget - budgetData.daily_spent,
      budget_used_percentage: ((budgetData.monthly_spent / monthlyBudget) * 100) || 0,
      last_reset: budgetData.last_daily_reset,
    };
  }

  async trackCost(amount: number): Promise<void> {
    await this.initializeBudgetFile();

    const budgetData = JSON.parse(fs.readFileSync(this.budgetFile, 'utf-8'));
    budgetData.daily_spent = (budgetData.daily_spent || 0) + amount;
    budgetData.weekly_spent = (budgetData.weekly_spent || 0) + amount;
    budgetData.monthly_spent = (budgetData.monthly_spent || 0) + amount;

    fs.writeFileSync(this.budgetFile, JSON.stringify(budgetData, null, 2));
  }

  async checkBudgetAvailable(estimatedCost: number): Promise<boolean> {
    const budgetStatus = await this.getBudgetStatus();
    return budgetStatus.daily_remaining >= estimatedCost;
  }
}