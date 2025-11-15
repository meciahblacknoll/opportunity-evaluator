"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT_v2.md
Referenced: backend/services/finance/simulator.py
Author: Claude Code

Phase 2 simulation API - float timeline simulation with APR costs.
"""

from typing import List, Optional
from datetime import date, datetime
from dataclasses import asdict

import aiosqlite
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from services.finance.simulator import FloatSimulator
from config import USE_PHASE2

router = APIRouter()


async def get_db():
    """Database dependency (imported from main)."""
    from main import get_db as _get_db
    async for db in _get_db():
        yield db


# Request/Response Models

class SimulateRequest(BaseModel):
    """Request model for simulation."""
    available_cash: int = Field(..., description="Available cash in cents", ge=0)
    opportunity_ids: List[int] = Field(..., description="IDs of opportunities to simulate")
    start_date: date = Field(..., description="Simulation start date")
    end_date: date = Field(..., description="Simulation end date")
    account_ids: Optional[List[int]] = Field(default=None, description="Account IDs for float (all if omitted)")


class FloatUsageResponse(BaseModel):
    """Response model for float usage."""
    account_id: int
    amount_used: int
    start_date: date
    end_date: date
    apr_percent: float
    total_cost: float


class SimulateResponse(BaseModel):
    """Response model for simulation results."""
    input_snapshot: dict
    timeline: List[dict]
    float_usage: List[FloatUsageResponse]
    total_apr_cost: float
    projected_net_profit: float
    warnings: List[str]
    success: bool


@router.post("/simulate", response_model=SimulateResponse)
async def simulate_opportunities(
    request: SimulateRequest,
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Simulate opportunity execution with float and APR costs.

    **Simulation Process:**
    1. Loads selected opportunities and accounts
    2. Builds timeline of cashflow events
    3. Day-by-day simulation:
       - If cash available → use cash
       - If cash insufficient → use float from best account (lowest APR)
    4. Calculates total APR costs and net profit

    **Returns:**
    - Complete daily timeline
    - Float usage per account
    - Total APR costs
    - Projected net profit
    - Warnings (e.g., insufficient funds)

    **Phase 2 Feature:** Requires USE_PHASE2=true in config.
    """
    if not USE_PHASE2:
        raise HTTPException(
            status_code=501,
            detail="Simulation requires Phase 2 features (set USE_PHASE2=true)"
        )

    # Fetch opportunities
    opportunities = await _fetch_opportunities(db, request.opportunity_ids)
    if len(opportunities) != len(request.opportunity_ids):
        raise HTTPException(
            status_code=404,
            detail="One or more opportunities not found"
        )

    # Fetch accounts
    accounts = await _fetch_accounts(db, request.account_ids)
    if not accounts:
        raise HTTPException(
            status_code=400,
            detail="No accounts available for float"
        )

    # Fetch cashflow events in date range
    cashflow_events = await _fetch_cashflow_events(
        db,
        request.start_date,
        request.end_date
    )

    # Run simulation
    simulator = FloatSimulator()
    result = simulator.simulate(
        available_cash=request.available_cash,
        selected_opportunities=opportunities,
        start_date=request.start_date,
        end_date=request.end_date,
        accounts=accounts,
        cashflow_events=cashflow_events
    )

    # Convert FloatUsage dataclasses to response model
    float_usage_response = [
        FloatUsageResponse(
            account_id=fu.account_id,
            amount_used=fu.amount_used,
            start_date=fu.start_date,
            end_date=fu.end_date,
            apr_percent=fu.apr_percent,
            total_cost=fu.total_cost
        )
        for fu in result.float_usage
    ]

    return SimulateResponse(
        input_snapshot=result.input_snapshot,
        timeline=result.timeline,
        float_usage=float_usage_response,
        total_apr_cost=result.total_apr_cost,
        projected_net_profit=result.projected_net_profit,
        warnings=result.warnings,
        success=result.success
    )


# Helper functions

async def _fetch_opportunities(
    db: aiosqlite.Connection,
    opportunity_ids: List[int]
) -> List[dict]:
    """Fetch opportunities by IDs."""
    if not opportunity_ids:
        return []

    placeholders = ",".join("?" * len(opportunity_ids))
    query = f"""
        SELECT id, name, initial_investment, expected_return, turnaround_days
        FROM opportunities
        WHERE id IN ({placeholders})
    """

    async with db.execute(query, opportunity_ids) as cursor:
        rows = await cursor.fetchall()

    return [
        {
            "id": row[0],
            "name": row[1],
            "initial_investment": row[2],
            "expected_return": row[3],
            "turnaround_days": row[4]
        }
        for row in rows
    ]


async def _fetch_accounts(
    db: aiosqlite.Connection,
    account_ids: Optional[List[int]]
) -> List[dict]:
    """Fetch accounts for float. If account_ids is None, fetch all credit cards."""
    if account_ids:
        placeholders = ",".join("?" * len(account_ids))
        query = f"""
            SELECT id, name, type, available_credit, apr_percent
            FROM accounts
            WHERE id IN ({placeholders})
        """
        params = account_ids
    else:
        # Fetch all credit card accounts
        query = """
            SELECT id, name, type, available_credit, apr_percent
            FROM accounts
            WHERE type = 'credit_card'
        """
        params = []

    async with db.execute(query, params) as cursor:
        rows = await cursor.fetchall()

    return [
        {
            "id": row[0],
            "name": row[1],
            "type": row[2],
            "available_credit": row[3],
            "apr_percent": row[4]
        }
        for row in rows
    ]


async def _fetch_cashflow_events(
    db: aiosqlite.Connection,
    start_date: date,
    end_date: date
) -> List[dict]:
    """Fetch cashflow events within date range."""
    query = """
        SELECT id, account_id, amount, kind, date, description
        FROM cashflow_events
        WHERE date BETWEEN ? AND ?
        ORDER BY date ASC
    """

    async with db.execute(query, [start_date, end_date]) as cursor:
        rows = await cursor.fetchall()

    return [
        {
            "id": row[0],
            "account_id": row[1],
            "amount": row[2],
            "kind": row[3],
            "date": row[4],
            "description": row[5]
        }
        for row in rows
    ]
