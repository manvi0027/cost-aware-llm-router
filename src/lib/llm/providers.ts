import { ModelTier } from '@/src/types';
import modelsConfig from '@/config/models.json';

export interface LLMResponse {
  text: string;
  tokens_used: { input: number; output: number };
  cost: number;
}

export class LLMProvider {
  async getResponse(params: {
    model: ModelTier;
    query: string;
    max_tokens: number;
    temperature: number;
  }): Promise<LLMResponse> {
    // Always use mock for now
    return this.getMockResponse(params.model, params.query, params.max_tokens);
  }

  private getMockResponse(model: ModelTier, query: string, maxTokens: number): LLMResponse {
    const mockResponses: Record<ModelTier, (q: string) => string> = {
      cheap: (q) => `[GPT-3.5 Turbo - Fast Response] Query: "${q.substring(0, 40)}..." | Answer: This is a fast and cost-effective response suitable for simple queries. Model: GPT-3.5 is optimized for speed and affordability.`,
      midtier: (q) => `[GPT-4 Turbo - Balanced Response] Query: "${q.substring(0, 40)}..." | Answer: After comprehensive analysis, here's a detailed response with balanced quality and cost. This mid-tier model provides excellent value for moderate complexity tasks.`,
      expert: (q) => `[GPT-4 - Expert Analysis] Query: "${q.substring(0, 40)}..." | Answer: Based on deep expert-level analysis, here are comprehensive insights and recommendations. This expert model provides the highest quality responses for complex reasoning tasks.`,
    };

    const responseText = mockResponses[model](query);
    const inputTokens = Math.ceil(query.length / 4);
    const outputTokens = Math.ceil(responseText.length / 4);

    const modelData = modelsConfig.models[model];
    const cost = (inputTokens / 1000) * modelData.cost_per_1k_input_tokens + (outputTokens / 1000) * modelData.cost_per_1k_output_tokens;

    return {
      text: responseText,
      tokens_used: { input: inputTokens, output: outputTokens },
      cost,
    };
  }
}