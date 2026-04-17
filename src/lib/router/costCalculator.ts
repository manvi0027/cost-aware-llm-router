import { ModelTier } from '@/src/types';
import modelsConfig from '@/config/models.json';

export class CostCalculator {
  calculateCost(tier: ModelTier, inputTokens: number, outputTokens: number): number {
    const modelData = modelsConfig.models[tier];
    const inputCost = (inputTokens / 1000) * modelData.cost_per_1k_input_tokens;
    const outputCost = (outputTokens / 1000) * modelData.cost_per_1k_output_tokens;
    return inputCost + outputCost;
  }

  estimateCostRange(tier: ModelTier, minInputTokens: number, maxOutputTokens: number): { min: number; max: number } {
    const modelData = modelsConfig.models[tier];
    const minCost = (minInputTokens / 1000) * modelData.cost_per_1k_input_tokens;
    const maxCost = (minInputTokens / 1000) * modelData.cost_per_1k_input_tokens + (maxOutputTokens / 1000) * modelData.cost_per_1k_output_tokens;
    return { min: minCost, max: maxCost };
  }

  compareModelCosts(inputTokens: number, outputTokens: number): Record<ModelTier, number> {
    return {
      cheap: this.calculateCost('cheap', inputTokens, outputTokens),
      midtier: this.calculateCost('midtier', inputTokens, outputTokens),
      expert: this.calculateCost('expert', inputTokens, outputTokens),
    };
  }
}