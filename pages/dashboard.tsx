import { useState, useEffect } from 'react';
import styles from '@/styles/dashboard.module.css';

interface RouteResponse {
  response: string;
  model_used: string;
  routing_decision: {
    selected_model: string;
    difficulty_score: number;
    actual_cost: number;
    budget_remaining: number;
    reason: string;
  };
  tokens_used: {
    input: number;
    output: number;
    total: number;
  };
  actual_cost: number;
  latency_ms: number;
}

interface BudgetStatus {
  daily_budget: number;
  daily_spent: number;
  daily_remaining: number;
  budget_used_percentage: number;
  monthly_budget: number;
  monthly_spent: number;
  monthly_remaining: number;
}

interface Metrics {
  total_queries: number;
  total_cost: number;
  model_distribution: {
    cheap: number;
    midtier: number;
    expert: number;
  };
  average_difficulty: number;
  average_latency_ms: number;
  average_cost_per_query: number;
}

export default function Dashboard() {
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState('demo-user');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<RouteResponse | null>(null);
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBudget();
    fetchMetrics();
    const interval = setInterval(() => {
      fetchBudget();
      fetchMetrics();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchBudget = async () => {
    try {
      const res = await fetch('/api/budget');
      const data = await res.json();
      setBudget(data);
    } catch (err) {
      console.error('Budget fetch error:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics?days=1');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Metrics fetch error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, user_id: userId }),
      });

      if (!res.ok) throw new Error('Failed to process query');
      const data = await res.json();
      setLastResponse(data);
      setQuery('');
      fetchBudget();
      fetchMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing query');
    } finally {
      setLoading(false);
    }
  };

  const getModelColor = (model: string) => {
    if (model.includes('3.5')) return '#10b981';
    if (model.includes('4 Turbo')) return '#f59e0b';
    return '#ef4444';
  };

  const getDifficultyColor = (score: number) => {
    if (score < 0.3) return '#10b981';
    if (score < 0.7) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🚀 Cost-Aware LLMOps Platform</h1>
        <p>Intelligent AI Model Routing with Machine Learning</p>
      </header>

      <main className={styles.main}>
        {/* Query Input Section */}
        <section className={styles.section}>
          <h2>📝 Query Interface</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Your Query:</label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your question... (e.g., 'Hello' or 'Analyze quantum computing')"
                disabled={loading}
                rows={3}
              />
            </div>
            <div className={styles.formGroup}>
              <label>User ID:</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="demo-user"
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? 'Processing...' : 'Send Query'}
            </button>
          </form>
          {error && <div className={styles.error}>{error}</div>}
        </section>

        {/* Last Response Section */}
        {lastResponse && (
          <section className={styles.section}>
            <h2>📊 Routing Decision</h2>
            <div className={styles.responseGrid}>
              <div className={styles.responseCard}>
                <h3>AI Response</h3>
                <p>{lastResponse.response}</p>
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <label>Model Selected</label>
                  <div
                    className={styles.badge}
                    style={{
                      backgroundColor: getModelColor(lastResponse.model_used),
                    }}
                  >
                    {lastResponse.model_used}
                  </div>
                </div>

                <div className={styles.stat}>
                  <label>Difficulty Score</label>
                  <div
                    className={styles.badge}
                    style={{
                      backgroundColor: getDifficultyColor(
                        lastResponse.routing_decision.difficulty_score
                      ),
                    }}
                  >
                    {lastResponse.routing_decision.difficulty_score.toFixed(
                      2
                    )}
                  </div>
                </div>

                <div className={styles.stat}>
                  <label>Cost</label>
                  <div className={styles.cost}>
                    ${lastResponse.actual_cost.toFixed(6)}
                  </div>
                </div>

                <div className={styles.stat}>
                  <label>Latency</label>
                  <div className={styles.latency}>
                    {lastResponse.latency_ms}ms
                  </div>
                </div>

                <div className={styles.stat}>
                  <label>Tokens Input</label>
                  <div className={styles.tokens}>
                    {lastResponse.tokens_used.input}
                  </div>
                </div>

                <div className={styles.stat}>
                  <label>Tokens Output</label>
                  <div className={styles.tokens}>
                    {lastResponse.tokens_used.output}
                  </div>
                </div>
              </div>

              <div className={styles.responseCard}>
                <h3>Routing Reason</h3>
                <p>{lastResponse.routing_decision.reason}</p>
              </div>
            </div>
          </section>
        )}

        {/* Budget Status Section */}
        {budget && (
          <section className={styles.section}>
            <h2>💰 Budget Status</h2>
            <div className={styles.budgetGrid}>
              <div className={styles.budgetCard}>
                <h3>Daily Budget</h3>
                <div className={styles.budgetBar}>
                  <div
                    className={styles.budgetFill}
                    style={{
                      width: `${budget.budget_used_percentage}%`,
                      backgroundColor:
                        budget.budget_used_percentage > 80
                          ? '#ef4444'
                          : budget.budget_used_percentage > 50
                          ? '#f59e0b'
                          : '#10b981',
                    }}
                  />
                </div>
                <div className={styles.budgetStats}>
                  <span>Spent: ${budget.daily_spent.toFixed(6)}</span>
                  <span>Budget: ${budget.daily_budget}</span>
                  <span>Remaining: ${budget.daily_remaining.toFixed(6)}</span>
                  <span className={styles.percentage}>
                    {budget.budget_used_percentage.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className={styles.budgetCard}>
                <h3>Monthly Budget</h3>
                <div className={styles.budgetBar}>
                  <div
                    className={styles.budgetFill}
                    style={{
                      width: `${(
                        (budget.monthly_spent / budget.monthly_budget) *
                        100
                      ).toFixed(1)}%`,
                      backgroundColor:
                        (budget.monthly_spent / budget.monthly_budget) * 100 >
                        80
                          ? '#ef4444'
                          : (budget.monthly_spent / budget.monthly_budget) *
                              100 >
                            50
                          ? '#f59e0b'
                          : '#10b981',
                    }}
                  />
                </div>
                <div className={styles.budgetStats}>
                  <span>Spent: ${budget.monthly_spent.toFixed(6)}</span>
                  <span>Budget: ${budget.monthly_budget}</span>
                  <span>Remaining: ${budget.monthly_remaining.toFixed(6)}</span>
                  <span className={styles.percentage}>
                    {(
                      (budget.monthly_spent / budget.monthly_budget) *
                      100
                    ).toFixed(2)}
                    %
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Metrics Section */}
        {metrics && (
          <section className={styles.section}>
            <h2>📈 Analytics & Metrics</h2>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <h3>Total Queries</h3>
                <div className={styles.metricValue}>{metrics.total_queries}</div>
              </div>

              <div className={styles.metricCard}>
                <h3>Total Cost</h3>
                <div className={styles.metricValue}>
                  ${metrics.total_cost.toFixed(6)}
                </div>
              </div>

              <div className={styles.metricCard}>
                <h3>Avg Cost/Query</h3>
                <div className={styles.metricValue}>
                  ${metrics.average_cost_per_query.toFixed(6)}
                </div>
              </div>

              <div className={styles.metricCard}>
                <h3>Avg Difficulty</h3>
                <div className={styles.metricValue}>
                  {metrics.average_difficulty.toFixed(2)}
                </div>
              </div>

              <div className={styles.metricCard}>
                <h3>Avg Latency</h3>
                <div className={styles.metricValue}>
                  {metrics.average_latency_ms.toFixed(0)}ms
                </div>
              </div>
            </div>

            {/* Model Distribution */}
            <div className={styles.distributionSection}>
              <h3>Model Distribution</h3>
              <div className={styles.distributionGrid}>
                <div className={styles.distributionCard}>
                  <div className={styles.distributionLabel}>GPT-3.5 Turbo</div>
                  <div className={styles.distributionBar}>
                    <div
                      className={styles.distributionFill}
                      style={{
                        width: `${
                          (metrics.model_distribution.cheap /
                            metrics.total_queries) *
                          100
                        }%`,
                        backgroundColor: '#10b981',
                      }}
                    />
                  </div>
                  <div className={styles.distributionCount}>
                    {metrics.model_distribution.cheap} queries
                    {metrics.total_queries > 0 &&
                      ` (${(
                        (metrics.model_distribution.cheap /
                          metrics.total_queries) *
                        100
                      ).toFixed(1)}%)`}
                  </div>
                </div>

                <div className={styles.distributionCard}>
                  <div className={styles.distributionLabel}>GPT-4 Turbo</div>
                  <div className={styles.distributionBar}>
                    <div
                      className={styles.distributionFill}
                      style={{
                        width: `${
                          (metrics.model_distribution.midtier /
                            metrics.total_queries) *
                          100
                        }%`,
                        backgroundColor: '#f59e0b',
                      }}
                    />
                  </div>
                  <div className={styles.distributionCount}>
                    {metrics.model_distribution.midtier} queries
                    {metrics.total_queries > 0 &&
                      ` (${(
                        (metrics.model_distribution.midtier /
                          metrics.total_queries) *
                        100
                      ).toFixed(1)}%)`}
                  </div>
                </div>

                <div className={styles.distributionCard}>
                  <div className={styles.distributionLabel}>GPT-4</div>
                  <div className={styles.distributionBar}>
                    <div
                      className={styles.distributionFill}
                      style={{
                        width: `${
                          (metrics.model_distribution.expert /
                            metrics.total_queries) *
                          100
                        }%`,
                        backgroundColor: '#ef4444',
                      }}
                    />
                  </div>
                  <div className={styles.distributionCount}>
                    {metrics.model_distribution.expert} queries
                    {metrics.total_queries > 0 &&
                      ` (${(
                        (metrics.model_distribution.expert /
                          metrics.total_queries) *
                        100
                      ).toFixed(1)}%)`}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Info Section */}
        <section className={styles.section}>
          <h2>ℹ️ System Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h3>ML Model</h3>
              <p>✅ Accuracy: 86.83%</p>
              <p>✅ Trained on 40 queries</p>
              <p>✅ 4 datasets (Climate, Medical, Code, Finance)</p>
            </div>

            <div className={styles.infoCard}>
              <h3>Features</h3>
              <p>✅ Intelligent routing</p>
              <p>✅ Real-time cost tracking</p>
              <p>✅ Budget enforcement</p>
              <p>✅ Complete analytics</p>
            </div>

            <div className={styles.infoCard}>
              <h3>Cost Optimization</h3>
              <p>✅ 60% savings vs baseline</p>
              <p>✅ Smart model selection</p>
              <p>✅ Budget-aware cascading</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}