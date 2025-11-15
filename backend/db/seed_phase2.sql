-- PROVENANCE
-- Created: 2025-11-14
-- Prompt: PROMPTS/PLANNING_PROMPT_v2.md
-- Author: Claude Code
-- Seed data for Phase 2 - Deterministic test examples

-- Clear existing Phase 2 data (idempotent)
DELETE FROM opportunity_meta;
DELETE FROM cashflow_events;
DELETE FROM limit_windows;
DELETE FROM loan_terms;
DELETE FROM credit_card_cycles;
DELETE FROM accounts;

-- Example accounts

-- Account 1: Chase Sapphire Reserve (credit card)
INSERT INTO accounts (
    name, type, credit_limit, current_balance, apr_percent,
    statement_day, due_day, available_credit, notes
) VALUES (
    'Chase Sapphire Reserve',
    'credit_card',
    10000,  -- $10k limit
    300,    -- $300 current balance
    24.0,   -- 24% APR
    15,     -- Statement closes on 15th
    10,     -- Due on 10th of next month
    9700,   -- $9,700 available
    'Primary rewards card for travel'
);

-- Account 2: Citi Double Cash (credit card)
INSERT INTO accounts (
    name, type, credit_limit, current_balance, apr_percent,
    statement_day, due_day, available_credit, notes
) VALUES (
    'Citi Double Cash',
    'credit_card',
    5000,
    0,
    21.99,
    20,
    15,
    5000,
    '2% cashback card'
);

-- Account 3: Personal Loan
INSERT INTO accounts (
    name, type, credit_limit, current_balance, apr_percent,
    statement_day, due_day, available_credit, notes
) VALUES (
    'Personal Loan - SoFi',
    'loan',
    0,      -- Loans don't have credit limit
    2000,   -- $2000 principal remaining
    12.0,   -- 12% APR
    NULL,
    5,      -- Payment due 5th of month
    0,
    'Fixed-rate personal loan'
);

-- Account 4: Checking Account
INSERT INTO accounts (
    name, type, credit_limit, current_balance, apr_percent,
    statement_day, due_day, available_credit, notes
) VALUES (
    'Chase Total Checking',
    'bank_account',
    0,
    5000,   -- $5k balance
    0.01,   -- 0.01% APY (negligible)
    NULL,
    NULL,
    5000,
    'Primary checking account'
);

-- Loan terms for account 3
INSERT INTO loan_terms (
    account_id, principal, apr_percent, compounding_period,
    monthly_payment, term_months
) VALUES (
    3,      -- Personal Loan account
    2000,
    12.0,
    'monthly',
    70,     -- $70/month payment
    36      -- 36 month term
);

-- Credit card cycle for Chase Sapphire (recent statement)
INSERT INTO credit_card_cycles (
    account_id, statement_start, statement_end,
    balance_at_statement, min_payment, due_date
) VALUES (
    1,      -- Chase Sapphire Reserve
    '2025-10-16',
    '2025-11-15',
    300,
    25,     -- $25 minimum
    '2025-12-10'
);

-- Limit windows (available float windows)
-- Chase Sapphire has extra available during certain periods
INSERT INTO limit_windows (
    account_id, start_date, end_date, available_amount, notes
) VALUES (
    1,
    '2025-11-15',
    '2025-12-10',
    9700,
    'Full credit available after statement until due date'
);

-- Cashflow events
-- Expected income
INSERT INTO cashflow_events (
    account_id, amount, kind, date, description
) VALUES (
    4,      -- Checking account
    3000,
    'inflow',
    '2025-11-30',
    'Paycheck'
);

-- Loan payment
INSERT INTO cashflow_events (
    account_id, amount, kind, date, description
) VALUES (
    3,      -- Personal loan
    70,
    'outflow',
    '2025-12-05',
    'Monthly loan payment'
);

-- Add churning/bonus metadata to existing opportunities

-- Chase Sapphire Bonus (opportunity id 2 from Phase 1)
INSERT INTO opportunity_meta (
    opportunity_id, is_churn_bonus, min_spend, reward_amount,
    reward_type, required_accounts, expected_payout_days,
    impact, confidence, ease
) VALUES (
    2,
    1,      -- Is a churning bonus
    4000,   -- $4k minimum spend
    800,    -- 80k points = ~$800 value
    'points',
    '[1]',  -- Requires account ID 1 (Chase Sapphire)
    90,     -- 90 days to earn + receive
    9,      -- High impact
    9,      -- High confidence
    5       -- Medium ease (need to hit spend)
);

-- Gift Card churning (opportunity id 5 from Phase 1)
INSERT INTO opportunity_meta (
    opportunity_id, is_churn_bonus, min_spend, reward_amount,
    reward_type, required_accounts, expected_payout_days,
    impact, confidence, ease
) VALUES (
    5,
    0,      -- Not a signup bonus, but churning activity
    2000,
    40,
    'cash',
    '[]',   -- No specific account required
    7,      -- 7 days cycle
    3,      -- Low impact (small profit)
    8,      -- High confidence
    7       -- Relatively easy
);

-- Freelance project gets ICE scoring too
INSERT INTO opportunity_meta (
    opportunity_id, is_churn_bonus, min_spend, reward_amount,
    reward_type, required_accounts, expected_payout_days,
    impact, confidence, ease
) VALUES (
    1,
    0,
    0,
    3000,
    'cash',
    '[]',
    30,
    8,      -- High impact
    8,      -- High confidence
    6       -- Moderate ease
);
