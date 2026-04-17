cat > migrations/001_init.sql << 'SQL_EOF'
-- Initial database schema for advanced LLMOps

CREATE TABLE IF NOT EXISTS queries (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_used VARCHAR(50),
    actual_difficulty FLOAT,
    predicted_difficulty FLOAT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    actual_cost DECIMAL(10, 6),
    latency_ms INTEGER,
    model_confidence FLOAT
);

CREATE TABLE IF NOT EXISTS routing_decisions (
    id SERIAL PRIMARY KEY,
    query_id INTEGER NOT NULL,
    selected_model VARCHAR(50) NOT NULL,
    difficulty_score FLOAT NOT NULL,
    reason VARCHAR(500),
    cascaded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget_tracking (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    total_queries INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 6) DEFAULT 0,
    model_cheap_queries INTEGER DEFAULT 0,
    model_midtier_queries INTEGER DEFAULT 0,
    model_expert_queries INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS experiments (
    id SERIAL PRIMARY KEY,
    experiment_name VARCHAR(255) NOT NULL,
    strategy_a VARCHAR(100),
    strategy_b VARCHAR(100),
    p_value FLOAT,
    statistically_significant BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SQL_EOF