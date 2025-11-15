"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
Referenced: backend/db/views.sql, ChatGPT recommendation for debug endpoint
Author: Claude Code

Metrics API endpoint - debug/validation endpoint for metric calculations.
"""

from typing import List, Optional

import aiosqlite
from fastapi import APIRouter, Depends, Query

from models.opportunity import MetricsDebug, ComputedMetrics

router = APIRouter()


async def get_db():
    """Database dependency (imported from main)."""
    from main import get_db as _get_db
    async for db in _get_db():
        yield db


@router.get("/metrics", response_model=List[ComputedMetrics])
async def get_computed_metrics(
    opportunity_id: Optional[int] = Query(default=None, description="Get metrics for specific opportunity"),
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Get computed metrics for all opportunities or a specific opportunity.

    Returns raw metric calculations without normalization.
    Useful for debugging and understanding how metrics are computed.
    """
    query = """
        SELECT
            id, name, category,
            initial_investment, expected_return, turnaround_days,
            time_required_hours, hourly_rate, risk_factor, certainty_score,
            is_recurring, liquidation_risk, max_capital_allowed, scaling_limit,
            profit, daily_roi_pct, risk_adjusted_roi, opportunity_cost,
            created_at, updated_at
        FROM computed_metrics
    """

    params = []

    if opportunity_id is not None:
        query += " WHERE id = ?"
        params.append(opportunity_id)

    async with db.execute(query, params) as cursor:
        rows = await cursor.fetchall()

    return [
        ComputedMetrics(
            id=row[0],
            name=row[1],
            category=row[2],
            initial_investment=row[3],
            expected_return=row[4],
            turnaround_days=row[5],
            time_required_hours=row[6],
            hourly_rate=row[7],
            risk_factor=row[8],
            certainty_score=row[9],
            is_recurring=bool(row[10]),
            liquidation_risk=row[11],
            max_capital_allowed=row[12],
            scaling_limit=row[13],
            profit=row[14],
            daily_roi_pct=row[15],
            risk_adjusted_roi=row[16],
            opportunity_cost=row[17],
            created_at=row[18],
            updated_at=row[19]
        )
        for row in rows
    ]


@router.get("/metrics/debug/{opportunity_id}", response_model=MetricsDebug)
async def get_metrics_debug(
    opportunity_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Get detailed step-by-step metric calculations for a specific opportunity.

    Includes formulas and intermediate steps for debugging.
    """
    # Get computed metrics
    query_computed = """
        SELECT
            id, name,
            initial_investment, expected_return, turnaround_days,
            time_required_hours, hourly_rate, risk_factor, certainty_score,
            profit, daily_roi_pct, risk_adjusted_roi, opportunity_cost
        FROM computed_metrics
        WHERE id = ?
    """

    async with db.execute(query_computed, (opportunity_id,)) as cursor:
        row = await cursor.fetchone()
        if not row:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Opportunity not found")

    # Get normalized scores
    query_ranked = """
        SELECT scored_roi, scored_cost, scored_certainty, composite_score
        FROM ranked_opportunities
        WHERE id = ?
    """

    async with db.execute(query_ranked, (opportunity_id,)) as cursor:
        ranked_row = await cursor.fetchone()

    return MetricsDebug(
        opportunity_id=row[0],
        opportunity_name=row[1],
        initial_investment=row[2],
        expected_return=row[3],
        turnaround_days=row[4],
        time_required_hours=row[5],
        hourly_rate=row[6],
        risk_factor=row[7],
        certainty_score=row[8],
        profit=row[9],
        daily_roi_pct=row[10],
        daily_roi_pct_formula=f"(({row[3]} - {row[2]}) / max({row[2]}, 1)) / {row[4]} * 100",
        risk_adjusted_roi=row[11],
        risk_adjusted_roi_formula=f"{row[10]} * (1 - {row[7]})",
        opportunity_cost=row[12],
        opportunity_cost_formula=f"{row[5]} * {row[6]}",
        scored_roi=ranked_row[0],
        scored_cost=ranked_row[1],
        scored_certainty=ranked_row[2],
        composite_score=ranked_row[3],
        composite_score_formula=f"({ranked_row[0]} * 0.5) + ({ranked_row[1]} * 0.3) + ({ranked_row[2]} * 0.2)"
    )
