export type ModelTier = 'cheap' | 'midtier' | 'expert';

export interface ModelConfig {
  name: string;
  provider: 'openai' | 'anthropic' | 'mock';
  model_id: string;
  tier: ModelTier;
  cost_per_1k_input_tokens: number;
  cost_per_1k_output_tokens: number;
  max_tokens: number;
  latency_ms: number;
  availability: number;
}

export interface QueryRequest {
  query: string;
  user_id: string;
  max_tokens?: number;
  temperature?: number;
  metadata?: Record<string, any>;
}

export interface RoutingDecision {
  selected_model: ModelTier;
  difficulty_score: number;
  estimated_cost: number;
  budget_remaining: number;
  reason: string;
  timestamp: string;
}

export interface QueryResponse {
  response: string;
  model_used: ModelTier;
  routing_decision: RoutingDecision;
  tokens_used: {
    input: number;
    output: number;
  };
  actual_cost: number;
  latency_ms: number;
  timestamp: string;
}

export interface BudgetStatus {
  monthly_budget: number;
  monthly_spent: number;
  monthly_remaining: number;
  daily_budget: number;
  daily_spent: number;
  daily_remaining: number;
  budget_used_percentage: number;
  last_reset: string;
}

export interface AnalyticsLog {
  timestamp: string;
  user_id: string;
  query: string;
  model_used: ModelTier;
  difficulty_score: number;
  cost: number;
  tokens_input: number;
  tokens_output: number;
  latency_ms: number;
  routing_reason: string;
}