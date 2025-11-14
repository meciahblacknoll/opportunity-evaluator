SYSTEM: You are Claude Code with read/write access to this repository. Your task: implement Phase 2 of the Opportunity Evaluator. Phase 2 adds ICE scoring, financial/account modeling, APR/float simulation, and churning/bonus opportunity modeling. All logic must be deterministic (SQL or Python). Do not invent numbers. Add provenance headers on new files.

CONTEXT:
- Repo currently contains Phase 1 (FastAPI + SQLite + React) at branch planning/claude-init (or main). Phase 1 implements deterministic metrics: daily ROI, risk-adjusted ROI, opportunity_cost, normalized composite_score.
- Phase 2 will extend schema, add new services, and provide deterministic simulation endpoints and tests.
- Human acts as middleman for Git pushes and secrets. Wait for human to push branches or give permission to create PRs.

GOAL (deliverables):
1. Create branch: phase-2/financial-modeling
2. Add Schema v2 SQL (see specification below)
3. Implement migrations using Alembic (or simple migration scripts if Alembic not present)
4. Backend:
   - services/scoring/ice.py (ICE scoring)
   - services/finance/apr.py (APR & float calculations)
   - services/finance/simulator.py (liquidity/float simulator)
   - routes/accounts.py (CRUD + summary endpoints)
   - routes/simulate.py (simulate float impact, ROI with APR)
   - Extend /api/recommendations to accept ?mode=composite|ice and ?available_cash and ?max_timeline_days
5. Frontend:
   - Add Accounts page (list, add, edit)
   - Add Simulation page (inputs: available cash, selected opportunities, dates)
   - Allow switching scoring mode in TopOpportunities UI
6. Tests:
   - Extend test_metrics.py with ICE tests
   - Add test_finance.py (APR, float simulation)
   - Add test_migrations.py (migrations idempotence)
7. Documentation:
   - PROMPTS/PLANNING_PROMPT_v2.md (this file)
   - docs/schema_v2.md (full schema)
   - docs/migration_plan.md (see plan)
   - docs/simulations.md (how to run, interpretation)
8. CI:
   - Add GitHub Actions job to run new tests + migrations in matrix (sqlite/in-memory)

HARD CONSTRAINTS:
- All numeric logic deterministic and covered by unit tests.
- No secret values in code; use .env.example and env vars.
- For all simulation outputs, include the input snapshot (JSON) in results to preserve provenance.
- Add feature flag CONFIG.USE_PHASE2=true to gate new endpoints.

SCHEMA V2 (implement these tables as SQL in db/schema_v2.sql):
- accounts (id, name, type, credit_limit, current_balance, apr_percent, statement_day, due_day, available_credit, notes, created_at)
- credit_card_cycles (id, account_id, statement_start, statement_end, balance_at_statement, min_payment, due_date)
- loan_terms (id, account_id, principal, apr_percent, compounding_period, monthly_payment, term_months)
- limit_windows (id, account_id, start_date, end_date, available_amount)
- cashflow_events (id, account_id, amount, kind ENUM[inflow,outflow], date, description)
- opportunity_meta (opportunity_id, is_churn_bonus BOOLEAN, min_spend, reward_amount, reward_type ENUM[cash,points,statement_credit], required_accounts JSON, expected_payout_days)

SIMULATION API:
POST /api/simulate/float
Body:
{
  "available_cash": number,
  "selected_opportunity_ids": [int],
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "use_accounts": [account_id or null]
}
Response must include:
- input_snapshot
- timeline of cash balances per day
- APR costs by account
- projected_net_profit (taking APR into account)
- warnings (e.g., utilization > 0.8 on any card, payment due inside locked window)

ICE SCORING (deterministic):
- Each opportunity will accept ICE fields: impact (0–10), confidence (0–10), ease (0–10), effort_hours
- ice_score = (impact * confidence) / max(ease, 1)
- Normalize ice_score into 0–1 using min/max across active opportunities before combining with ROI

RISK & FLOAT MODEL:
- APR daily rate = apr_percent / 100 / 365
- daily_interest_on_balance = balance * apr_daily
- cost_of_float_for_amount_X_for_n_days = X * ((1 + apr_daily) ** n - 1)  // compounding

TESTING:
- Provide deterministic seed scenarios:
  - credit card with 30-day statement, apr 24%, limit 5,000, current_balance 300
  - bank loan with principal 2000, apr 12%, monthly payment 70
  - example churn opportunity: min_spend 1000, reward 300, payout 30 days

OUTPUT:
- Push branch phase-2/financial-modeling
- Open PR "phase-2: financial modeling & ICE scoring"
- Attach plan.json with steps and test logs in PR
If any resource or permission missing, explain precisely.

END.
