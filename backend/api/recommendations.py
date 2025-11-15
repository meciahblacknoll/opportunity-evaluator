"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
Referenced: backend/db/views.sql
Author: Claude Code

Recommendations API endpoint - returns top opportunities by composite score.
Extended in Phase 2 to support ICE scoring mode.
"""

from typing import List, Literal, Optional

import aiosqlite
from fastapi import APIRouter, Depends, Query

from models.opportunity import RankedOpportunity
from config import USE_PHASE2

# Phase 2 imports (conditional)
if USE_PHASE2:
    from services.scoring.ice import rank_by_ice

router = APIRouter()


async def get_db():
    """Database dependency (imported from main)."""
    from main import get_db as _get_db
    async for db in _get_db():
        yield db


@router.get("/recommendations", response_model=List[RankedOpportunity])
async def get_recommendations(
    limit: int = Query(default=10, ge=1, le=100, description="Number of recommendations to return"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    mode: Literal["roi", "ice"] = Query(default="roi", description="Scoring mode: roi (composite) or ice"),
    available_cash: Optional[int] = Query(default=None, description="Available cash in cents (Phase 2)"),
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Get top opportunities ranked by scoring mode.

    **ROI Mode (default):**
    The composite score is calculated as:
    - 50% normalized risk-adjusted ROI
    - 30% normalized inverse opportunity cost
    - 20% certainty score

    **ICE Mode (Phase 2):**
    Ranks by ICE score: (Impact * Confidence) / Ease
    Normalized to 0-1 scale.

    Returns opportunities in descending order by selected scoring method.
    """
    # Phase 2: ICE scoring mode
    if mode == "ice" and USE_PHASE2:
        return await _get_ice_recommendations(db, limit, category, available_cash)

    # Default: ROI composite scoring (Phase 1)
    return await _get_roi_recommendations(db, limit, category)


async def _get_roi_recommendations(
    db: aiosqlite.Connection,
    limit: int,
    category: Optional[str]
) -> List[RankedOpportunity]:
    """Get recommendations using Phase 1 composite ROI scoring."""
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

    query += " LIMIT ?"
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


async def _get_ice_recommendations(
    db: aiosqlite.Connection,
    limit: int,
    category: Optional[str],
    available_cash: Optional[int]
) -> List[RankedOpportunity]:
    """Get recommendations using Phase 2 ICE scoring."""
    # Query opportunities with ICE fields
    query = """
        SELECT
            id,
            name,
            category,
            initial_investment,
            expected_return,
            turnaround_days,
            risk_level,
            confidence_score,
            opportunity_cost,
            impact,
            confidence,
            ease
        FROM opportunities_with_ice
    """

    params = []

    if category:
        query += " WHERE category = ?"
        params.append(category)

    async with db.execute(query, params) as cursor:
        rows = await cursor.fetchall()

    # Convert to dict format for ICE scoring
    opportunities = []
    for row in rows:
        opp = {
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "initial_investment": row[3],
            "expected_return": row[4],
            "turnaround_days": row[5],
            "risk_level": row[6],
            "confidence_score": row[7],
            "opportunity_cost": row[8],
            "impact": row[9],
            "confidence": row[10],
            "ease": row[11]
        }
        opportunities.append(opp)

    # Rank by ICE
    ranked = rank_by_ice(opportunities)

    # Convert to RankedOpportunity model (top N)
    results = []
    for opp, raw_ice, norm_ice in ranked[:limit]:
        # Calculate profit for display
        profit = opp["expected_return"] - opp["initial_investment"]
        daily_roi = (profit / max(opp["initial_investment"], 1)) / opp["turnaround_days"] * 100 if opp["turnaround_days"] > 0 else 0

        results.append(RankedOpportunity(
            id=opp["id"],
            name=opp["name"],
            category=opp["category"],
            profit=profit,
            daily_roi_pct=daily_roi,
            risk_adjusted_roi=0.0,  # Not used in ICE mode
            opportunity_cost=opp["opportunity_cost"],
            certainty_score=opp["confidence_score"],
            is_recurring=False,  # TODO: Add to opportunities table
            liquidation_risk=0,  # Not used in ICE mode
            scored_roi=raw_ice,  # Store raw ICE score
            scored_cost=0.0,  # Not used in ICE mode
            scored_certainty=norm_ice,  # Store normalized ICE score
            composite_score=norm_ice  # Use normalized ICE as composite
        ))

    return results
