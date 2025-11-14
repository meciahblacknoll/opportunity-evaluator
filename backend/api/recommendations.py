"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
Referenced: backend/db/views.sql
Author: Claude Code

Recommendations API endpoint - returns top opportunities by composite score.
"""

from typing import List

import aiosqlite
from fastapi import APIRouter, Depends, Query

from models.opportunity import RankedOpportunity

router = APIRouter()


async def get_db():
    """Database dependency (imported from main)."""
    from main import get_db as _get_db
    async for db in _get_db():
        yield db


@router.get("/recommendations", response_model=List[RankedOpportunity])
async def get_recommendations(
    limit: int = Query(default=10, ge=1, le=100, description="Number of recommendations to return"),
    category: str = Query(default=None, description="Filter by category"),
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Get top opportunities ranked by composite score.

    The composite score is calculated as:
    - 50% normalized risk-adjusted ROI
    - 30% normalized inverse opportunity cost
    - 20% certainty score

    Returns opportunities in descending order by composite score.
    """
    query = """
        SELECT
            id,
            name,
            category,
            profit,
            daily_roi_pct,
            risk_adjusted_roi,
            opportunity_cost,
            certainty_score,
            is_recurring,
            liquidation_risk,
            scored_roi,
            scored_cost,
            scored_certainty,
            composite_score
        FROM ranked_opportunities
    """

    params = []

    if category:
        query += " WHERE category = ?"
        params.append(category)

    query += f" LIMIT ?"
    params.append(limit)

    async with db.execute(query, params) as cursor:
        rows = await cursor.fetchall()

    return [
        RankedOpportunity(
            id=row[0],
            name=row[1],
            category=row[2],
            profit=row[3],
            daily_roi_pct=row[4],
            risk_adjusted_roi=row[5],
            opportunity_cost=row[6],
            certainty_score=row[7],
            is_recurring=bool(row[8]),
            liquidation_risk=row[9],
            scored_roi=row[10],
            scored_cost=row[11],
            scored_certainty=row[12],
            composite_score=row[13]
        )
        for row in rows
    ]
