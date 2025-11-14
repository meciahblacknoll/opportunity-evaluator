-- PROVENANCE
-- Created: 2025-11-14
-- Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
-- Referenced: Canonical test examples from plan
-- Author: Claude Code

-- Deterministic seed data for testing and demonstration
-- These are canonical examples that cover various opportunity types

-- Clear existing data (for reproducibility)
DELETE FROM opportunities;

-- Example 1: Freelance Web Project (zero initial investment)
-- This is the canonical test case from the planning document
INSERT INTO opportunities (
    name,
    initial_investment,
    expected_return,
    turnaround_days,
    time_required_hours,
    hourly_rate,
    risk_factor,
    certainty_score,
    category,
    effort_hours,
    is_recurring,
    liquidation_risk,
    max_capital_allowed,
    scaling_limit
) VALUES (
    'Freelance Web Project',
    0,              -- No upfront investment
    3000,           -- Expected return
    30,             -- 30 days turnaround
    40,             -- 40 hours of work
    50,             -- $50/hour rate
    0.2,            -- 20% risk
    0.8,            -- 80% certainty
    'Freelance',
    40,
    0,              -- Not recurring
    0.1,            -- Low liquidation risk (can stop anytime)
    0,
    1               -- Can only do once
);

-- Example 2: Bank Account Bonus (small investment, quick turnaround)
INSERT INTO opportunities (
    name,
    initial_investment,
    expected_return,
    turnaround_days,
    time_required_hours,
    hourly_rate,
    risk_factor,
    certainty_score,
    category,
    effort_hours,
    is_recurring,
    liquidation_risk,
    max_capital_allowed,
    scaling_limit
) VALUES (
    'Chase Sapphire Bonus',
    4000,           -- $4k spend requirement
    80000,           -- 80k points ≈ $800 value
    90,             -- 90 days to hit spend
    5,              -- 5 hours (application, tracking, redemption)
    50,
    0.1,            -- 10% risk (approval not guaranteed)
    0.9,            -- 90% certainty
    'Bank Bonus',
    5,
    0,              -- Not recurring (signup bonus)
    0.3,            -- Medium liquidation risk (need to hold account)
    4000,
    1
);

-- Example 3: Stock Investment (higher investment, longer term)
INSERT INTO opportunities (
    name,
    initial_investment,
    expected_return,
    turnaround_days,
    time_required_hours,
    hourly_rate,
    risk_factor,
    certainty_score,
    category,
    effort_hours,
    is_recurring,
    liquidation_risk,
    max_capital_allowed,
    scaling_limit
) VALUES (
    'Index Fund Investment',
    10000,          -- $10k investment
    11000,          -- 10% return = $1k
    365,            -- 1 year hold
    10,             -- 10 hours research/management
    50,
    0.3,            -- 30% risk (market volatility)
    0.7,            -- 70% certainty
    'Investment',
    10,
    1,              -- Recurring (can keep investing)
    0.5,            -- Medium-high liquidation risk (market timing)
    50000,          -- Can scale up
    10              -- Can repeat monthly
);

-- Example 4: Side Project App (high effort, high uncertainty)
INSERT INTO opportunities (
    name,
    initial_investment,
    expected_return,
    turnaround_days,
    time_required_hours,
    hourly_rate,
    risk_factor,
    certainty_score,
    category,
    effort_hours,
    is_recurring,
    liquidation_risk,
    max_capital_allowed,
    scaling_limit
) VALUES (
    'SaaS Side Project',
    500,            -- Hosting, domain, tools
    5000,           -- Optimistic revenue projection
    180,            -- 6 months to launch + first revenue
    200,            -- 200 hours of development
    50,
    0.7,            -- 70% risk (most side projects fail)
    0.3,            -- 30% certainty
    'Side Project',
    200,
    1,              -- Could be recurring revenue
    0.8,            -- High liquidation risk (sunk cost if failed)
    5000,
    1
);

-- Example 5: Manufactured Spending (churning)
INSERT INTO opportunities (
    name,
    initial_investment,
    expected_return,
    turnaround_days,
    time_required_hours,
    hourly_rate,
    risk_factor,
    certainty_score,
    category,
    effort_hours,
    is_recurring,
    liquidation_risk,
    max_capital_allowed,
    scaling_limit
) VALUES (
    'MS via Gift Cards',
    2000,           -- Gift card float
    2040,           -- 2% return on spend ($40 in points)
    7,              -- 7 days cycle (buy -> liquidate)
    3,              -- 3 hours per cycle
    50,
    0.15,           -- 15% risk (shutdown, tracking errors)
    0.85,           -- 85% certainty
    'Churning',
    3,
    1,              -- Highly recurring
    0.2,            -- Low liquidation risk (can sell GC)
    10000,
    50              -- Can repeat many times
);

-- Example 6: Online Course Creation
INSERT INTO opportunities (
    name,
    initial_investment,
    expected_return,
    turnaround_days,
    time_required_hours,
    hourly_rate,
    risk_factor,
    certainty_score,
    category,
    effort_hours,
    is_recurring,
    liquidation_risk,
    max_capital_allowed,
    scaling_limit
) VALUES (
    'Udemy Course',
    200,            -- Equipment, software
    3000,           -- Expected course sales
    90,             -- 3 months to create and start selling
    80,             -- 80 hours to create
    50,
    0.4,            -- 40% risk (saturated market)
    0.6,            -- 60% certainty
    'Freelance',
    80,
    1,              -- Passive recurring revenue
    0.6,            -- Medium-high liquidation risk (sunk time)
    1000,
    5               -- Can create more courses
);

-- Example 7: High-Certainty Consulting Gig
INSERT INTO opportunities (
    name,
    initial_investment,
    expected_return,
    turnaround_days,
    time_required_hours,
    hourly_rate,
    risk_factor,
    certainty_score,
    category,
    effort_hours,
    is_recurring,
    liquidation_risk,
    max_capital_allowed,
    scaling_limit
) VALUES (
    'Enterprise Consulting Contract',
    0,
    15000,          -- Fixed contract
    60,             -- 2 months
    100,            -- 100 hours
    50,
    0.05,           -- 5% risk (contract signed)
    0.95,           -- 95% certainty
    'Freelance',
    100,
    0,              -- One-time contract
    0.1,            -- Low liquidation risk
    0,
    1
);

-- Example 8: Cryptocurrency Trade (high risk, high reward)
INSERT INTO opportunities (
    name,
    initial_investment,
    expected_return,
    turnaround_days,
    time_required_hours,
    hourly_rate,
    risk_factor,
    certainty_score,
    category,
    effort_hours,
    is_recurring,
    liquidation_risk,
    max_capital_allowed,
    scaling_limit
) VALUES (
    'Crypto Swing Trade',
    5000,
    6000,           -- 20% target
    14,             -- 2 week hold
    10,             -- Research and monitoring
    50,
    0.6,            -- 60% risk (volatility)
    0.4,            -- 40% certainty
    'Investment',
    10,
    1,              -- Can repeat
    0.7,            -- High liquidation risk (timing matters)
    20000,
    20
);
