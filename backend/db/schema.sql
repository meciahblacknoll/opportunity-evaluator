-- PROVENANCE
-- Created: 2025-11-14
-- Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
-- Referenced: plan.json, ChatGPT corrections
-- Author: Claude Code

-- Opportunities Table
-- Stores all opportunities with their base metrics and computed fields
CREATE TABLE IF NOT EXISTS opportunities (
    -- Primary Key
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Core Fields
    name TEXT NOT NULL,
    initial_investment REAL DEFAULT 0,
    expected_return REAL NOT NULL,
    turnaround_days INTEGER NOT NULL CHECK(turnaround_days > 0),
    time_required_hours INTEGER NOT NULL CHECK(time_required_hours >= 0),
    hourly_rate REAL NOT NULL CHECK(hourly_rate > 0),
    risk_factor REAL NOT NULL CHECK(risk_factor >= 0 AND risk_factor <= 1),
    certainty_score REAL NOT NULL CHECK(certainty_score >= 0 AND certainty_score <= 1),

    -- Phase 1 Additions (ChatGPT feedback)
    -- Category allows grouping (e.g., "Freelance", "Investment", "Bank Bonus", "Churning")
    category TEXT,

    -- Effort hours may differ from time_required_hours (active vs total time)
    effort_hours INTEGER,

    -- Is this a recurring opportunity or one-time?
    is_recurring BOOLEAN DEFAULT 0,

    -- Liquidation risk (0.0 = easily liquidated, 1.0 = illiquid/high risk)
    liquidation_risk REAL CHECK(liquidation_risk IS NULL OR (liquidation_risk >= 0 AND liquidation_risk <= 1)),

    -- Maximum capital that can be allocated to this opportunity
    max_capital_allowed INTEGER,

    -- How many times can this opportunity be scaled/repeated?
    scaling_limit INTEGER,

    -- ICE Scoring Fields (Phase 2)
    impact INTEGER DEFAULT 5 CHECK(impact >= 0 AND impact <= 10),
    confidence INTEGER DEFAULT 5 CHECK(confidence >= 0 AND confidence <= 10),
    ease INTEGER DEFAULT 5 CHECK(ease >= 0 AND ease <= 10),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts Table
-- Placeholder for future float/liquidity modeling
-- Not actively used in Phase 1, but schema is ready for Phase 2+
CREATE TABLE IF NOT EXISTS accounts (
    -- Primary Key
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Account type (e.g., "Credit Card", "Bank Account", "Investment Account")
    type TEXT NOT NULL,

    -- Credit/Account Limits
    credit_limit INTEGER,
    current_balance INTEGER DEFAULT 0,

    -- Annual Percentage Rate (for credit cards, loans)
    apr REAL,

    -- Billing cycle info (for credit cards)
    statement_day INTEGER CHECK(statement_day IS NULL OR (statement_day >= 1 AND statement_day <= 31)),
    due_day INTEGER CHECK(due_day IS NULL OR (due_day >= 1 AND due_day <= 31)),

    -- Computed/derived fields
    available_credit INTEGER,

    -- Notes for manual tracking
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_opportunities_category ON opportunities(category);
CREATE INDEX IF NOT EXISTS idx_opportunities_is_recurring ON opportunities(is_recurring);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
