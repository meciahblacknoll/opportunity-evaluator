# Metric Lineage Documentation

**Project:** Opportunity Evaluator v1.1
**Created:** 2025-11-14
**Prompt:** PROMPTS/PLANNING_PROMPT.md (v1.1 with ChatGPT corrections)

---

## Overview

This document explains how to trace computed metrics back to their raw input data sources. All metrics are deterministic and can be reproduced given the same inputs.

---

## Metric Lineage Chain

### 1. Profit
**Formula:** `profit = expected_return - initial_investment`

**Input Sources:**
- `expected_return` ← `opportunities.expected_return` (user input)
- `initial_investment` ← `opportunities.initial_investment` (user input)

**SQL Implementation:** `backend/db/views.sql` line 17

---

### 2. Daily ROI Percentage
**Formula:** `daily_roi_pct = (profit / max(initial_investment, 1)) / turnaround_days * 100`

**Input Sources:**
- `profit` ← derived from metric #1
- `initial_investment` ← `opportunities.initial_investment` (user input)
- `turnaround_days` ← `opportunities.turnaround_days` (user input)

**Safeguards:**
- Uses `max(initial_investment, 1)` to prevent division by zero

**SQL Implementation:** `backend/db/views.sql` lines 21-26

---

### 3. Risk-Adjusted ROI
**Formula:** `risk_adjusted_roi = daily_roi_pct * (1 - risk_factor)`

**Input Sources:**
- `daily_roi_pct` ← derived from metric #2
- `risk_factor` ← `opportunities.risk_factor` (user input, range: 0.0-1.0)

**SQL Implementation:** `backend/db/views.sql` lines 28-37

---

### 4. Opportunity Cost
**Formula:** `opportunity_cost = time_required_hours * hourly_rate`

**Input Sources:**
- `time_required_hours` ← `opportunities.time_required_hours` (user input)
- `hourly_rate` ← `opportunities.hourly_rate` (user input)

**Phase 1 Note:** Time-based cost only. Capital-based opportunity cost will be added in future phases.

**SQL Implementation:** `backend/db/views.sql` lines 39-42

---

### 5. Composite Score (Normalized)
**Formula:** `composite_score = (scored_roi * 0.5) + (scored_cost * 0.3) + (scored_certainty * 0.2)`

**Input Sources:**
- `scored_roi` ← normalized `risk_adjusted_roi` (metric #3)
- `scored_cost` ← normalized `1 / max(opportunity_cost, 1)` (metric #4)
- `scored_certainty` ← `opportunities.certainty_score` (user input, already 0-1)

**Normalization Process:**
1. Compute min/max across all opportunities for each metric
2. Apply formula: `(value - min) / (max - min)` if `max > min`, else `0`
3. All scores are normalized to 0-1 scale before weighting

**Weights:**
- Risk-Adjusted ROI: 50%
- Opportunity Cost: 30%
- Certainty Score: 20%

**SQL Implementation:**
- Normalization: `backend/db/views.sql` lines 57-91
- Composite: `backend/db/views.sql` lines 118-122

---

## Tracing a Specific Opportunity

### Example: "Freelance Web Project"

**Raw Inputs:**
```
initial_investment: 0
expected_return: 3000
turnaround_days: 30
time_required_hours: 40
hourly_rate: 50
risk_factor: 0.2
certainty_score: 0.8
```

**Computation Chain:**

1. **Profit**
   `= 3000 - 0 = 3000`

2. **Daily ROI %**
   `= (3000 / max(0, 1)) / 30 * 100 = 10000.0%`

3. **Risk-Adjusted ROI**
   `= 10000.0 * (1 - 0.2) = 8000.0%`

4. **Opportunity Cost**
   `= 40 * 50 = 2000`

5. **Normalization** (depends on dataset)
   - `scored_roi` = normalize(8000.0) using min/max of all opportunities
   - `scored_cost` = normalize(1/2000) = normalize(0.0005)
   - `scored_certainty` = 0.8 (already normalized)

6. **Composite Score**
   `= (scored_roi * 0.5) + (scored_cost * 0.3) + (0.8 * 0.2)`

---

## Verification

To verify metric calculations:

1. **Use the `/api/metrics/debug/{id}` endpoint**
   - Returns step-by-step formulas with actual values
   - Shows exact computation for a specific opportunity

2. **Run unit tests:**
   ```bash
   pytest tests/test_metrics.py -v
   ```
   - Tests all formulas with canonical examples
   - Validates division-by-zero safeguards
   - Checks normalization correctness

3. **Inspect SQL views directly:**
   ```sql
   SELECT * FROM computed_metrics WHERE id = 1;
   SELECT * FROM ranked_opportunities WHERE id = 1;
   ```

---

## Data Flow Diagram

```
User Input (opportunities table)
    ↓
Computed Metrics View
    ├── profit
    ├── daily_roi_pct
    ├── risk_adjusted_roi
    └── opportunity_cost
    ↓
Normalized Metrics View
    ├── scored_roi (0-1)
    ├── scored_cost (0-1)
    └── scored_certainty (0-1)
    ↓
Ranked Opportunities View
    └── composite_score (weighted sum)
    ↓
API Endpoints
    ├── /recommendations
    ├── /metrics
    └── /metrics/debug/{id}
```

---

## Future Enhancements (Phase 2+)

Planned additions to lineage:

- **Capital-Based Opportunity Cost:** Incorporate `accounts` table for float/liquidity calculations
- **Dynamic Weights:** Allow user to customize composite score weights
- **Historical Tracking:** Store metric snapshots for trend analysis
- **Multi-Currency Support:** Convert all values to a base currency
- **Risk Models:** Add more sophisticated risk scoring beyond simple factors

---

## References

- ChatGPT Review: Corrected formulas for division-by-zero and normalization
- Planning Document: `PROMPTS/PLANNING_PROMPT.md` (v1.1)
- Implementation: `backend/db/views.sql`
- Tests: `tests/test_metrics.py`
