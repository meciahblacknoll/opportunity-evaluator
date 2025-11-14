-- PROVENANCE
-- Created: 2025-11-14
-- Prompt: ChatGPT Phase 2 core review feedback
-- Author: Claude Code
--
-- Phase 2 database views for ICE scoring and financial modeling.

-- Opportunities with ICE scoring metadata
-- Merges base opportunities table with opportunity_meta for ICE fields
CREATE VIEW IF NOT EXISTS opportunities_with_ice AS
SELECT
    o.id,
    o.name,
    o.category,
    o.initial_investment,
    o.expected_return,
    o.turnaround_days,
    o.risk_level,
    o.confidence_score,
    o.opportunity_cost,
    o.created_at,
    o.updated_at,
    -- ICE scoring fields (with defaults if meta doesn't exist)
    COALESCE(o.impact, 5) as impact,
    COALESCE(o.confidence, 5) as confidence,
    COALESCE(o.ease, 5) as ease,
    -- Opportunity meta fields
    COALESCE(m.is_churn_bonus, 0) as is_churn_bonus,
    COALESCE(m.min_spend, 0) as min_spend,
    COALESCE(m.reward_amount, 0) as reward_amount,
    COALESCE(m.reward_type, 'cash') as reward_type,
    m.required_accounts,
    COALESCE(m.expected_payout_days, o.turnaround_days) as expected_payout_days
FROM opportunities o
LEFT JOIN opportunity_meta m ON m.opportunity_id = o.id;

-- Accounts with current float availability
-- Joins accounts with limit_windows to show time-based credit availability
CREATE VIEW IF NOT EXISTS accounts_with_float AS
SELECT
    a.id,
    a.name,
    a.type,
    a.credit_limit,
    a.current_balance,
    a.apr_percent,
    a.statement_day,
    a.due_day,
    a.available_credit,
    -- Current limit window (if any)
    lw.available_amount as window_available,
    lw.start_date as window_start,
    lw.end_date as window_end,
    -- Effective available float (minimum of account limit and window limit)
    CASE
        WHEN lw.available_amount IS NULL THEN a.available_credit
        WHEN date('now') BETWEEN lw.start_date AND lw.end_date
            THEN MIN(a.available_credit, lw.available_amount)
        ELSE a.available_credit
    END as effective_available
FROM accounts a
LEFT JOIN limit_windows lw ON lw.account_id = a.id
    AND date('now') BETWEEN lw.start_date AND lw.end_date;

-- Credit card cycles with upcoming due dates
-- Shows active and upcoming cycles for payment planning
CREATE VIEW IF NOT EXISTS upcoming_credit_cycles AS
SELECT
    c.id as cycle_id,
    c.account_id,
    a.name as account_name,
    c.statement_start,
    c.statement_end,
    c.balance_at_statement,
    c.min_payment,
    c.due_date,
    a.apr_percent,
    -- Days until due
    julianday(c.due_date) - julianday('now') as days_until_due,
    -- Interest if only min payment made
    (c.balance_at_statement - c.min_payment) * (a.apr_percent / 100.0 / 365.0) * 30 as estimated_monthly_interest
FROM credit_card_cycles c
JOIN accounts a ON a.id = c.account_id
WHERE c.due_date >= date('now')
ORDER BY c.due_date ASC;
