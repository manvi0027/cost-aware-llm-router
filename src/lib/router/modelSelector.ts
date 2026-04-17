import { ModelTier, QueryRequest, RoutingDecision } from '@/src/types';
import { DifficultyEstimator } from './difficultyEstimator';
import { CostCalculator } from './costCalculator';
import { BudgetManager } from '@/src/lib/budget/budgetManager';

export class ModelSelector {
  private difficultyEstimator = new DifficultyEstimator();
  private costCalculator = new CostCalculator();
  private budgetManager = new BudgetManager();

  async selectModel(query: QueryRequest): Promise<RoutingDecision> {
    const difficultyScore = this.difficultyEstimator.estimateDifficulty(query);
    const estimatedTokens = this.difficultyEstimator.getEstimatedTokens(query.query);

    let selectedTier: ModelTier;
    let reason: string;

    // Determine model based on difficulty
    const cheapThreshold = parseFloat(process.env.DIFFICULTY_THRESHOLD_CHEAP || '0.3');
    const midtierThreshold = parseFloat(process.env.DIFFICULTY_THRESHOLD_MIDTIER || '0.7');

    if (difficultyScore < cheapThreshold) {
      selectedTier = 'cheap';
      reason = `Query is simple (difficulty: ${difficultyScore.toFixed(2)}) - using cheap model`;
    } else if (difficultyScore < midtierThreshold) {
      selectedTier = 'midtier';
      reason = `Query has moderate complexity (difficulty: ${difficultyScore.toFixed(2)}) - using mid-tier model`;
    } else {
      selectedTier = 'expert';
      reason = `Query requires expert analysis (difficulty: ${difficultyScore.toFixed(2)}) - using expert model`;
    }

    const budgetStatus = await this.budgetManager.getBudgetStatus();
    const estimatedCost = this.costCalculator.calculateCost(selectedTier, estimatedTokens.input, estimatedTokens.output);

    // Cascade if budget exceeded
    if (estimatedCost > budgetStatus.daily_remaining && process.env.ENABLE_CASCADING === 'true') {
      const cascaded = await this.findCheapestViableModel(selectedTier, estimatedTokens);
      if (cascaded !== selectedTier) {
        const newCost = this.costCalculator.calculateCost(cascaded, estimatedTokens.input, estimatedTokens.output);
        return {
          selected_model: cascaded,
          difficulty_score: difficultyScore,
          estimated_cost: newCost,
          budget_remaining: Math.max(budgetStatus.daily_remaining - newCost, 0),
          reason: `Budget cascade: downgraded from ${selectedTier} to ${cascaded}`,
          timestamp: new Date().toISOString(),
        };
      }
    }

    return {
      selected_model: selectedTier,
      difficulty_score: difficultyScore,
      estimated_cost: estimatedCost,
      budget_remaining: Math.max(budgetStatus.daily_remaining - estimatedCost, 0),
      reason,
      timestamp: new Date().toISOString(),
    };
  }

  private async findCheapestViableModel(preferredTier: ModelTier, tokens: { input: number; output: number }): Promise<ModelTier> {
    const tiers: ModelTier[] = ['cheap', 'midtier', 'expert'];
    const tierIndex = tiers.indexOf(preferredTier);

    for (let i = 0; i < tierIndex; i++) {
      const tier = tiers[i];
      const cost = this.costCalculator.calculateCost(tier, tokens.input, tokens.output);
      const budgetStatus = await this.budgetManager.getBudgetStatus();

      if (cost <= budgetStatus.daily_remaining) {
        return tier;
      }
    }

    return 'cheap';
  }
}