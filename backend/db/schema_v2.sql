-- PROVENANCE
-- Created: 2025-11-14
-- Prompt: PROMPTS/PLANNING_PROMPT_v2.md (v1)
-- Referenced: ChatGPT Phase 2 schema specification
-- Author: Claude Code

-- Phase 2 Schema Extensions
-- Adds financial modeling, accounts, APR tracking, and churning/bonus support

-- accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,             -- 'credit_card', 'bank_account', 'loan', 'line_of_credit'
  credit_limit INTEGER DEFAULT 0,
  current_balance INTEGER DEFAULT 0,
  apr_percent REAL DEFAULT 0.0,
  statement_day INTEGER,          -- day of month when statement closes (1-31)
  due_day INTEGER,                -- day of month when due
  available_credit INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- credit card cycles (snapshot per statement)
CREATE TABLE IF NOT EXISTS credit_card_cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  statement_start TEXT NOT NULL,
  statement_end TEXT NOT NULL,
  balance_at_statement INTEGER DEFAULT 0,
  min_payment INTEGER DEFAULT 0,
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(account_id, statement_end)  -- ChatGPT correction: prevent duplicate cycles
);

-- loan_terms
CREATE TABLE IF NOT EXISTS loan_terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  principal INTEGER NOT NULL,
  apr_percent REAL NOT NULL,
  compounding_period TEXT DEFAULT 'monthly',
  monthly_payment INTEGER,
  term_months INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- limit_windows: temporary windows of available liquidity
CREATE TABLE IF NOT EXISTS limit_windows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  available_amount INTEGER NOT NULL,
  notes TEXT
);

-- cashflow events
CREATE TABLE IF NOT EXISTS cashflow_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER REFERENCES accounts(id),
  amount INTEGER NOT NULL,
  kind TEXT NOT NULL,   -- 'inflow' or 'outflow'
  date TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- opportunity_meta for churn-style offers
-- Note: ICE fields moved to main opportunities table per ChatGPT review
CREATE TABLE IF NOT EXISTS opportunity_meta (
  opportunity_id INTEGER PRIMARY KEY REFERENCES opportunities(id),
  is_churn_bonus BOOLEAN DEFAULT 0,
  min_spend INTEGER DEFAULT 0,
  reward_amount INTEGER DEFAULT 0,
  reward_type TEXT DEFAULT 'cash', -- 'cash', 'points', 'statement_credit'
  required_accounts TEXT, -- JSON string array of account IDs or types
  expected_payout_days INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_credit_card_cycles_account ON credit_card_cycles(account_id);
CREATE INDEX IF NOT EXISTS idx_loan_terms_account ON loan_terms(account_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_events_account ON cashflow_events(account_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_events_date ON cashflow_events(date);

-- Simulation performance indexes (ChatGPT correction)
CREATE INDEX IF NOT EXISTS idx_credit_card_cycles_due_date ON credit_card_cycles(due_date);
CREATE INDEX IF NOT EXISTS idx_limit_windows_start_date ON limit_windows(start_date);
CREATE INDEX IF NOT EXISTS idx_limit_windows_end_date ON limit_windows(end_date);
