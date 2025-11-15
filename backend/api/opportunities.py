"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
Referenced: backend/db/schema.sql, backend/models/opportunity.py
Author: Claude Code

Opportunities CRUD API endpoints.
"""

from typing import List

import aiosqlite
from fastapi import APIRouter, Depends, HTTPException

from models.opportunity import Opportunity, OpportunityCreate, OpportunityUpdate

router = APIRouter()


async def get_db():
    """Database dependency (imported from main)."""
    from main import get_db as _get_db
    async for db in _get_db():
        yield db


@router.post("/opportunities", response_model=Opportunity, status_code=201)
async def create_opportunity(
    opportunity: OpportunityCreate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Create a new opportunity."""
    query = """
        INSERT INTO opportunities (
            name, initial_investment, expected_return, turnaround_days,
            time_required_hours, hourly_rate, risk_factor, certainty_score,
            category, effort_hours, is_recurring, liquidation_risk,
            max_capital_allowed, scaling_limit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    params = (
        opportunity.name,
        opportunity.initial_investment,
        opportunity.expected_return,
        opportunity.turnaround_days,
        opportunity.time_required_hours,
        opportunity.hourly_rate,
        opportunity.risk_factor,
        opportunity.certainty_score,
        opportunity.category,
        opportunity.effort_hours,
        opportunity.is_recurring,
        opportunity.liquidation_risk,
        opportunity.max_capital_allowed,
        opportunity.scaling_limit
    )

    async with db.execute(query, params) as cursor:
        opportunity_id = cursor.lastrowid

    await db.commit()

    # Fetch the created opportunity
    return await get_opportunity(opportunity_id, db)


@router.get("/opportunities", response_model=List[Opportunity])
async def list_opportunities(
    db: aiosqlite.Connection = Depends(get_db)
):
    """List all opportunities."""
    query = """
        SELECT
            id, name, initial_investment, expected_return, turnaround_days,
            time_required_hours, hourly_rate, risk_factor, certainty_score,
            category, effort_hours, is_recurring, liquidation_risk,
            max_capital_allowed, scaling_limit, created_at, updated_at
        FROM opportunities
        ORDER BY created_at DESC
    """

    async with db.execute(query) as cursor:
        rows = await cursor.fetchall()

    return [
        Opportunity(
            id=row[0],
            name=row[1],
            initial_investment=row[2],
            expected_return=row[3],
            turnaround_days=row[4],
            time_required_hours=row[5],
            hourly_rate=row[6],
            risk_factor=row[7],
            certainty_score=row[8],
            category=row[9],
            effort_hours=row[10],
            is_recurring=bool(row[11]),
            liquidation_risk=row[12],
            max_capital_allowed=row[13],
            scaling_limit=row[14],
            created_at=row[15],
            updated_at=row[16]
        )
        for row in rows
    ]


@router.get("/opportunities/{opportunity_id}", response_model=Opportunity)
async def get_opportunity(
    opportunity_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Get a specific opportunity by ID."""
    query = """
        SELECT
            id, name, initial_investment, expected_return, turnaround_days,
            time_required_hours, hourly_rate, risk_factor, certainty_score,
            category, effort_hours, is_recurring, liquidation_risk,
            max_capital_allowed, scaling_limit, created_at, updated_at
        FROM opportunities
        WHERE id = ?
    """

    async with db.execute(query, (opportunity_id,)) as cursor:
        row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    return Opportunity(
        id=row[0],
        name=row[1],
        initial_investment=row[2],
        expected_return=row[3],
        turnaround_days=row[4],
        time_required_hours=row[5],
        hourly_rate=row[6],
        risk_factor=row[7],
        certainty_score=row[8],
        category=row[9],
        effort_hours=row[10],
        is_recurring=bool(row[11]),
        liquidation_risk=row[12],
        max_capital_allowed=row[13],
        scaling_limit=row[14],
        created_at=row[15],
        updated_at=row[16]
    )


@router.put("/opportunities/{opportunity_id}", response_model=Opportunity)
async def update_opportunity(
    opportunity_id: int,
    opportunity: OpportunityUpdate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Update an existing opportunity."""
    # Check if opportunity exists
    existing = await get_opportunity(opportunity_id, db)

    # Build update query dynamically based on provided fields
    update_fields = []
    params = []

    for field, value in opportunity.model_dump(exclude_unset=True).items():
        update_fields.append(f"{field} = ?")
        params.append(value)

    if not update_fields:
        # No fields to update
        return existing

    # Add updated_at
    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(opportunity_id)

    query = f"UPDATE opportunities SET {', '.join(update_fields)} WHERE id = ?"

    await db.execute(query, params)
    await db.commit()

    # Fetch updated opportunity
    return await get_opportunity(opportunity_id, db)


@router.delete("/opportunities/{opportunity_id}", status_code=204)
async def delete_opportunity(
    opportunity_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Delete an opportunity."""
    # Check if opportunity exists
    await get_opportunity(opportunity_id, db)

    query = "DELETE FROM opportunities WHERE id = ?"
    await db.execute(query, (opportunity_id,))
    await db.commit()

    return None
