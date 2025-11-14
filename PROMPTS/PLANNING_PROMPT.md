# Opportunity Evaluator - Master Plan

**Status:** Planning Phase - ChatGPT Reviewed & Corrected
**Version:** 1.1 (ChatGPT corrections applied)
**Date:** 2025-11-14
**Collaborators:** Claude Code + ChatGPT (Human middleman: Meciah)

---

## PROJECT VISION

An automated system to evaluate, score, and rank opportunities (projects, investments, side hustles, decisions) using deterministic metrics. The system should:

1. Accept opportunity inputs (time, money, expected return, risk factors)
2. Calculate standardized metrics (ROI, risk-adjusted ROI, opportunity cost)
3. Rank opportunities and surface top recommendations
4. Provide clear lineage from raw inputs to computed scores

---

## ARCHITECTURE PROPOSAL

### Tech Stack
- **Database:** SQLite (simple, portable, no external deps)
- **Backend:** Python FastAPI (modern, async, auto-docs)
- **Frontend:** React + Vite (fast dev, minimal config)
- **Tests:** pytest + React Testing Library
- **Deployment:** Docker (reproducible env)

### Repository Structure
```
opportunity-evaluator/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── recommendations.py      # GET /recommendations
│   │   └── opportunities.py        # CRUD for opportunities
│   ├── db/
│   │   ├── schema.sql              # SQLite schema
│   │   ├── views.sql               # Computed metrics views
│   │   └── seed_data.sql           # Example opportunities
│   ├── models/
│   │   └── opportunity.py          # Pydantic models
│   ├── main.py                     # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── TopOpportunities.jsx
│   │   ├── components/
│   │   │   └── OpportunityCard.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── tests/
│   ├── test_metrics.py             # Unit tests for calculations
│   ├── test_api.py                 # API integration tests
│   └── fixtures/                   # Test data
├── docs/
│   ├── lineage.md                  # Metric provenance
│   ├── api.md                      # API documentation
│   └── deployment.md
├── PROMPTS/
│   └── PLANNING_PROMPT.md          # Version-controlled prompts
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```

---

## CORE METRICS (Deterministic SQL/Python)

### 1. Daily ROI Percentage
```
profit = expected_return - initial_investment
daily_roi_pct = (profit / max(initial_investment, 1)) / turnaround_days * 100
```
**Note:** Uses `max(initial_investment, 1)` to prevent division by zero for zero-investment opportunities.

### 2. Risk-Adjusted ROI
```
risk_adjusted_roi = daily_roi_pct * (1 - risk_factor)
where risk_factor ∈ [0.0, 1.0]
```

### 3. Opportunity Cost
```
opportunity_cost = time_required_hours * hourly_rate
```
**Note:** Phase 1 uses time-based cost only. Capital-based opportunity cost models will be added in future phases.

### 4. Composite Score (for ranking)
```
# Normalize inputs to 0-1 scale
scored_roi = normalize(risk_adjusted_roi)
scored_cost = normalize(1 / max(opportunity_cost, 1))
scored_certainty = certainty_score

# Weighted composite score
composite_score = (scored_roi * 0.5) + (scored_cost * 0.3) + (scored_certainty * 0.2)
```

**Normalization function:**
```python
def normalize(value, min_val, max_val):
    return (value - min_val) / (max_val - min_val) if max_val > min_val else 0
```

---

## DATABASE SCHEMA

### Opportunities Table
```sql
CREATE TABLE opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    initial_investment REAL DEFAULT 0,
    expected_return REAL NOT NULL,
    turnaround_days INTEGER NOT NULL,
    time_required_hours INTEGER NOT NULL,
    hourly_rate REAL NOT NULL,
    risk_factor REAL CHECK(risk_factor >= 0 AND risk_factor <= 1),
    certainty_score REAL CHECK(certainty_score >= 0 AND certainty_score <= 1),

    -- Phase 1 additions (ChatGPT feedback)
    category TEXT,
    effort_hours INTEGER,
    is_recurring BOOLEAN DEFAULT 0,
    liquidation_risk REAL,
    max_capital_allowed INTEGER,
    scaling_limit INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Accounts Table (Placeholder for future phases)
```sql
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    credit_limit INTEGER,
    current_balance INTEGER DEFAULT 0,
    apr REAL,
    statement_day INTEGER,
    due_day INTEGER,
    available_credit INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Note:** The `accounts` table supports future float/liquidity modeling but is not used in Phase 1.

---

## DELIVERABLES (Phase 1 - Bootstrap)

### Backend
- [ ] FastAPI app skeleton
- [ ] SQLite database with schema (opportunities + accounts tables)
- [ ] SQL views for computed metrics (with inline lineage comments)
- [ ] GET /recommendations endpoint (top 10 by composite_score)
- [ ] GET /metrics endpoint (debug/validation endpoint)
- [ ] POST /opportunities endpoint (add new opportunity)
- [ ] Deterministic seed script (5-10 canonical examples)

### Frontend
- [ ] React app with Vite
- [ ] TopOpportunities page (displays top 10)
- [ ] OpportunityCard component (shows metrics)
- [ ] Basic styling (minimal, functional)

### Testing
- [ ] test_metrics.py (validates all 4 formulas with canonical examples)
- [ ] test_api.py (validates endpoints return correct data)
- [ ] Pytest output attached to PR

### Documentation
- [ ] lineage.md (explains metric calculations)
- [ ] PROMPTS/PLANNING_PROMPT.md (versioned)
- [ ] README.md (quickstart instructions)
- [ ] .env.example (no secrets in code)

### Infrastructure
- [ ] Dockerfile (backend)
- [ ] docker-compose.yml (backend + frontend)
- [ ] requirements.txt
- [ ] package.json

---

## CANONICAL TEST EXAMPLE

```python
# Expected test case for test_metrics.py
opportunity = {
    "name": "Freelance Web Project",
    "initial_investment": 0,
    "expected_return": 3000,
    "turnaround_days": 30,
    "time_required_hours": 40,
    "hourly_rate": 50,
    "risk_factor": 0.2,
    "certainty_score": 0.8,
    "category": "Freelance",
    "effort_hours": 40,
    "is_recurring": False,
    "liquidation_risk": 0.1,
    "max_capital_allowed": 0,
    "scaling_limit": 1
}

# Expected outputs (using corrected formulas)
profit = 3000 - 0  # = 3000
daily_roi_pct = (3000 / max(0, 1)) / 30 * 100  # = 10000.0
risk_adjusted_roi = 10000.0 * (1 - 0.2)  # = 8000.0
opportunity_cost = 40 * 50  # = 2000

# Normalized composite score (values depend on dataset min/max)
# Will be calculated after normalization is implemented
```

**Additional Test Cases:**
```python
# Test case 2: Non-zero investment
opportunity_2 = {
    "initial_investment": 1000,
    "expected_return": 1500,
    "turnaround_days": 60,
    # ... other fields
}
# profit = 500
# daily_roi_pct = (500 / 1000) / 60 * 100 = 0.833%

# Test case 3: Zero opportunity cost edge case
opportunity_3 = {
    "time_required_hours": 0,
    "hourly_rate": 50,
    # ...
}
# opportunity_cost = 0
# composite_score uses max(opportunity_cost, 1) to prevent division by zero
```

---

## BRANCH & PR PLAN

**Branch:** `planning/claude-init`

**PR Title:** "planning: initial Claude bootstrap for Opportunity Evaluator"

**PR Description:**
- plan.json (this file converted to JSON)
- readiness_report.md (open questions ≤ 6 bullets)
- Attached pytest output (all tests passing)

---

## OPEN QUESTIONS / AMBIGUITIES

1. **Input Method:** Should opportunities be added via UI form, or just API/seed data for now?
   - **Recommendation:** API + seed data only (UI form = Phase 2)

2. **Persistence:** SQLite file location? In-memory vs. disk?
   - **Recommendation:** Disk (`./data/opportunities.db`), gitignored

3. **Frontend API Integration:** Hardcoded localhost:8000 or env var?
   - **Recommendation:** .env.example with `VITE_API_URL=http://localhost:8000`

4. **Deployment Target:** Local Docker only, or prep for cloud (Railway, Render)?
   - **Recommendation:** Local Docker first, deployment guide in Phase 2

5. **Auth:** No auth for now, or basic API key?
   - **Recommendation:** No auth in Phase 1 (document as TODO)

6. **CI/CD:** GitHub Actions for tests?
   - **Recommendation:** Yes, add `.github/workflows/test.yml` in Phase 1

---

## ESTIMATED EFFORT

| Task | Hours |
|------|-------|
| Backend API + DB schema | 3 |
| SQL views for metrics | 2 |
| Frontend React skeleton | 2 |
| Unit tests + integration tests | 2 |
| Docker setup | 1 |
| Documentation | 1 |
| **Total** | **11 hours** |

---

## PROVENANCE HEADER TEMPLATE

All created files must include:
```
/// PROVENANCE
/// Created: 2025-11-14
/// Prompt: PROMPTS/PLANNING_PROMPT.md (v1)
/// Referenced: [list any repo files used]
/// Author: Claude Code
```

---

## CHATGPT REVIEW SUMMARY

**Reviewed:** 2025-11-14
**Verdict:** ✅ Approved to proceed with corrections applied

**Required Fixes Applied:**
1. ✅ Fixed daily ROI formula to prevent division by zero
2. ✅ Fixed composite score with normalization
3. ✅ Added missing schema fields (category, effort_hours, is_recurring, liquidation_risk, max_capital_allowed, scaling_limit)
4. ✅ Clarified opportunity_cost as time-based (Phase 1)
5. ✅ Added accounts table placeholder for future float/liquidity modeling

**Recommended Improvements Incorporated:**
- Added `/metrics` debug endpoint to deliverables
- Documented inline lineage comments in SQL views
- Created deterministic seed script requirement

**Optional Enhancements (Deferred to Phase 2+):**
- Alembic migrations (will use raw SQL for Phase 1 simplicity)
- Job queue for ML
- Feature flags

---

**STATUS:** ✅ Ready to proceed with implementation
