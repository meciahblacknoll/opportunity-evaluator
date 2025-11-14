-- PROVENANCE
-- Created: 2025-11-14
-- Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
-- Referenced: ChatGPT corrected formulas, plan.json
-- Author: Claude Code

-- computed_metrics view
-- Computes all derived metrics for each opportunity
-- Includes inline lineage comments for metric traceability

CREATE VIEW IF NOT EXISTS computed_metrics AS
SELECT
    id,
    name,
    category,
    initial_investment,
    expected_return,
    turnaround_days,
    time_required_hours,
    hourly_rate,
    risk_factor,
    certainty_score,
    is_recurring,
    liquidation_risk,
    max_capital_allowed,
    scaling_limit,

    -- METRIC 1: Profit
    -- LINEAGE: expected_return, initial_investment
    -- FORMULA: profit = expected_return - initial_investment
    (expected_return - initial_investment) AS profit,

    -- METRIC 2: Daily ROI Percentage
    -- LINEAGE: profit (derived), initial_investment, turnaround_days
    -- FORMULA: daily_roi_pct = (profit / max(initial_investment, 1)) / turnaround_days * 100
    -- SAFEGUARD: Uses max(initial_investment, 1) to prevent division by zero
    (
        ((expected_return - initial_investment) / MAX(initial_investment, 1.0))
        / turnaround_days * 100.0
    ) AS daily_roi_pct,

    -- METRIC 3: Risk-Adjusted ROI
    -- LINEAGE: daily_roi_pct (derived), risk_factor
    -- FORMULA: risk_adjusted_roi = daily_roi_pct * (1 - risk_factor)
    (
        (
            ((expected_return - initial_investment) / MAX(initial_investment, 1.0))
            / turnaround_days * 100.0
        ) * (1.0 - risk_factor)
    ) AS risk_adjusted_roi,

    -- METRIC 4: Opportunity Cost
    -- LINEAGE: time_required_hours, hourly_rate
    -- FORMULA: opportunity_cost = time_required_hours * hourly_rate
    -- NOTE: Phase 1 uses time-based cost only; capital-based costs added in future phases
    (time_required_hours * hourly_rate) AS opportunity_cost,

    -- Timestamps
    created_at,
    updated_at

FROM opportunities;


-- normalized_metrics view
-- Normalizes metrics to 0-1 scale for composite score calculation
-- This view computes min/max across all opportunities for normalization

CREATE VIEW IF NOT EXISTS normalized_metrics AS
WITH metric_ranges AS (
    -- Compute min/max for each metric across all opportunities
    SELECT
        MIN(daily_roi_pct) AS min_roi,
        MAX(daily_roi_pct) AS max_roi,
        MIN(risk_adjusted_roi) AS min_risk_adj_roi,
        MAX(risk_adjusted_roi) AS max_risk_adj_roi,
        MIN(1.0 / MAX(opportunity_cost, 1.0)) AS min_inv_cost,
        MAX(1.0 / MAX(opportunity_cost, 1.0)) AS max_inv_cost
    FROM computed_metrics
),
normalized AS (
    SELECT
        cm.id,
        cm.name,
        cm.category,
        cm.profit,
        cm.daily_roi_pct,
        cm.risk_adjusted_roi,
        cm.opportunity_cost,
        cm.certainty_score,
        cm.is_recurring,
        cm.liquidation_risk,

        -- LINEAGE: risk_adjusted_roi (from computed_metrics), min_risk_adj_roi, max_risk_adj_roi
        -- FORMULA: scored_roi = (value - min) / (max - min) if max > min else 0
        CASE
            WHEN mr.max_risk_adj_roi > mr.min_risk_adj_roi
            THEN (cm.risk_adjusted_roi - mr.min_risk_adj_roi) / (mr.max_risk_adj_roi - mr.min_risk_adj_roi)
            ELSE 0.0
        END AS scored_roi,

        -- LINEAGE: opportunity_cost (from computed_metrics), min_inv_cost, max_inv_cost
        -- FORMULA: scored_cost = normalize(1 / max(opportunity_cost, 1))
        CASE
            WHEN mr.max_inv_cost > mr.min_inv_cost
            THEN ((1.0 / MAX(cm.opportunity_cost, 1.0)) - mr.min_inv_cost) / (mr.max_inv_cost - mr.min_inv_cost)
            ELSE 0.0
        END AS scored_cost,

        -- LINEAGE: certainty_score (already normalized 0-1)
        cm.certainty_score AS scored_certainty,

        -- Store min/max for debugging
        mr.min_risk_adj_roi,
        mr.max_risk_adj_roi,
        mr.min_inv_cost,
        mr.max_inv_cost

    FROM computed_metrics cm
    CROSS JOIN metric_ranges mr
)
SELECT * FROM normalized;


-- ranked_opportunities view
-- Final composite score calculation and ranking
-- This is the primary view used by the /recommendations endpoint

CREATE VIEW IF NOT EXISTS ranked_opportunities AS
SELECT
    nm.id,
    nm.name,
    nm.category,
    nm.profit,
    nm.daily_roi_pct,
    nm.risk_adjusted_roi,
    nm.opportunity_cost,
    nm.certainty_score,
    nm.is_recurring,
    nm.liquidation_risk,

    -- Normalized scores (0-1 scale)
    nm.scored_roi,
    nm.scored_cost,
    nm.scored_certainty,

    -- METRIC 5: Composite Score (weighted)
    -- LINEAGE: scored_roi, scored_cost, scored_certainty (all from normalized_metrics)
    -- FORMULA: composite_score = (scored_roi * 0.5) + (scored_cost * 0.3) + (scored_certainty * 0.2)
    -- WEIGHTS: ROI=50%, Cost=30%, Certainty=20%
    (
        (nm.scored_roi * 0.5) +
        (nm.scored_cost * 0.3) +
        (nm.scored_certainty * 0.2)
    ) AS composite_score

FROM normalized_metrics nm
ORDER BY composite_score DESC;
