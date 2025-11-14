"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT_v2.md
Referenced: backend/db/schema_v2.sql
Author: Claude Code

Phase 2 accounts API - CRUD for accounts, credit cycles, loans, cashflow.
"""

from typing import List, Optional
from datetime import date

import aiosqlite
from fastapi import APIRouter, Depends, HTTPException, Query

from models.account import (
    Account,
    AccountCreate,
    CreditCardCycle,
    CreditCardCycleCreate,
    LoanTerm,
    LoanTermCreate,
    CashflowEvent,
    CashflowEventCreate,
    LimitWindow,
    LimitWindowCreate
)

router = APIRouter()


async def get_db():
    """Database dependency (imported from main)."""
    from main import get_db as _get_db
    async for db in _get_db():
        yield db


# ==================== ACCOUNTS ====================

@router.get("/accounts", response_model=List[Account])
async def list_accounts(
    account_type: Optional[str] = Query(default=None, description="Filter by account type"),
    db: aiosqlite.Connection = Depends(get_db)
):
    """List all accounts with optional type filter."""
    query = "SELECT id, name, type, credit_limit, current_balance, apr_percent, statement_day, due_day, available_credit, notes, created_at FROM accounts"
    params = []

    if account_type:
        query += " WHERE type = ?"
        params.append(account_type)

    query += " ORDER BY created_at DESC"

    async with db.execute(query, params) as cursor:
        rows = await cursor.fetchall()

    return [
        Account(
            id=row[0],
            name=row[1],
            type=row[2],
            credit_limit=row[3],
            current_balance=row[4],
            apr_percent=row[5],
            statement_day=row[6],
            due_day=row[7],
            available_credit=row[8],
            notes=row[9],
            created_at=row[10]
        )
        for row in rows
    ]


@router.get("/accounts/{account_id}", response_model=Account)
async def get_account(
    account_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Get a specific account by ID."""
    query = "SELECT id, name, type, credit_limit, current_balance, apr_percent, statement_day, due_day, available_credit, notes, created_at FROM accounts WHERE id = ?"

    async with db.execute(query, [account_id]) as cursor:
        row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Account not found")

    return Account(
        id=row[0],
        name=row[1],
        type=row[2],
        credit_limit=row[3],
        current_balance=row[4],
        apr_percent=row[5],
        statement_day=row[6],
        due_day=row[7],
        available_credit=row[8],
        notes=row[9],
        created_at=row[10]
    )


@router.post("/accounts", response_model=Account, status_code=201)
async def create_account(
    account: AccountCreate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Create a new account."""
    query = """
        INSERT INTO accounts (name, type, credit_limit, current_balance, apr_percent, statement_day, due_day, available_credit, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    async with db.execute(
        query,
        [
            account.name,
            account.type,
            account.credit_limit,
            account.current_balance,
            account.apr_percent,
            account.statement_day,
            account.due_day,
            account.available_credit,
            account.notes
        ]
    ) as cursor:
        account_id = cursor.lastrowid

    await db.commit()

    # Fetch and return created account
    return await get_account(account_id, db)


@router.put("/accounts/{account_id}", response_model=Account)
async def update_account(
    account_id: int,
    account: AccountCreate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Update an existing account."""
    query = """
        UPDATE accounts
        SET name = ?, type = ?, credit_limit = ?, current_balance = ?,
            apr_percent = ?, statement_day = ?, due_day = ?,
            available_credit = ?, notes = ?
        WHERE id = ?
    """

    async with db.execute(
        query,
        [
            account.name,
            account.type,
            account.credit_limit,
            account.current_balance,
            account.apr_percent,
            account.statement_day,
            account.due_day,
            account.available_credit,
            account.notes,
            account_id
        ]
    ) as cursor:
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Account not found")

    await db.commit()

    return await get_account(account_id, db)


@router.delete("/accounts/{account_id}", status_code=204)
async def delete_account(
    account_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Delete an account."""
    query = "DELETE FROM accounts WHERE id = ?"

    async with db.execute(query, [account_id]) as cursor:
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Account not found")

    await db.commit()


# ==================== CREDIT CARD CYCLES ====================

@router.get("/accounts/{account_id}/cycles", response_model=List[CreditCardCycle])
async def list_credit_cycles(
    account_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """List all credit card cycles for an account."""
    query = """
        SELECT id, account_id, statement_start, statement_end,
               balance_at_statement, min_payment, due_date, created_at
        FROM credit_card_cycles
        WHERE account_id = ?
        ORDER BY statement_end DESC
    """

    async with db.execute(query, [account_id]) as cursor:
        rows = await cursor.fetchall()

    return [
        CreditCardCycle(
            id=row[0],
            account_id=row[1],
            statement_start=row[2],
            statement_end=row[3],
            balance_at_statement=row[4],
            min_payment=row[5],
            due_date=row[6],
            created_at=row[7]
        )
        for row in rows
    ]


@router.post("/accounts/{account_id}/cycles", response_model=CreditCardCycle, status_code=201)
async def create_credit_cycle(
    account_id: int,
    cycle: CreditCardCycleCreate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Create a new credit card cycle."""
    if cycle.account_id != account_id:
        raise HTTPException(status_code=400, detail="Account ID mismatch")

    query = """
        INSERT INTO credit_card_cycles (account_id, statement_start, statement_end,
                                        balance_at_statement, min_payment, due_date)
        VALUES (?, ?, ?, ?, ?, ?)
    """

    async with db.execute(
        query,
        [
            cycle.account_id,
            cycle.statement_start,
            cycle.statement_end,
            cycle.balance_at_statement,
            cycle.min_payment,
            cycle.due_date
        ]
    ) as cursor:
        cycle_id = cursor.lastrowid

    await db.commit()

    # Fetch and return created cycle
    async with db.execute(
        "SELECT id, account_id, statement_start, statement_end, balance_at_statement, min_payment, due_date, created_at FROM credit_card_cycles WHERE id = ?",
        [cycle_id]
    ) as cursor:
        row = await cursor.fetchone()

    return CreditCardCycle(
        id=row[0],
        account_id=row[1],
        statement_start=row[2],
        statement_end=row[3],
        balance_at_statement=row[4],
        min_payment=row[5],
        due_date=row[6],
        created_at=row[7]
    )


# ==================== LOAN TERMS ====================

@router.get("/accounts/{account_id}/loan-terms", response_model=List[LoanTerm])
async def list_loan_terms(
    account_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """List all loan terms for an account."""
    query = """
        SELECT id, account_id, principal, apr_percent, compounding_period,
               monthly_payment, term_months, created_at
        FROM loan_terms
        WHERE account_id = ?
        ORDER BY created_at DESC
    """

    async with db.execute(query, [account_id]) as cursor:
        rows = await cursor.fetchall()

    return [
        LoanTerm(
            id=row[0],
            account_id=row[1],
            principal=row[2],
            apr_percent=row[3],
            compounding_period=row[4],
            monthly_payment=row[5],
            term_months=row[6],
            created_at=row[7]
        )
        for row in rows
    ]


@router.post("/accounts/{account_id}/loan-terms", response_model=LoanTerm, status_code=201)
async def create_loan_term(
    account_id: int,
    loan: LoanTermCreate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Create a new loan term."""
    if loan.account_id != account_id:
        raise HTTPException(status_code=400, detail="Account ID mismatch")

    query = """
        INSERT INTO loan_terms (account_id, principal, apr_percent, compounding_period,
                               monthly_payment, term_months)
        VALUES (?, ?, ?, ?, ?, ?)
    """

    async with db.execute(
        query,
        [
            loan.account_id,
            loan.principal,
            loan.apr_percent,
            loan.compounding_period,
            loan.monthly_payment,
            loan.term_months
        ]
    ) as cursor:
        loan_id = cursor.lastrowid

    await db.commit()

    # Fetch and return created loan
    async with db.execute(
        "SELECT id, account_id, principal, apr_percent, compounding_period, monthly_payment, term_months, created_at FROM loan_terms WHERE id = ?",
        [loan_id]
    ) as cursor:
        row = await cursor.fetchone()

    return LoanTerm(
        id=row[0],
        account_id=row[1],
        principal=row[2],
        apr_percent=row[3],
        compounding_period=row[4],
        monthly_payment=row[5],
        term_months=row[6],
        created_at=row[7]
    )


# ==================== CASHFLOW EVENTS ====================

@router.get("/cashflow", response_model=List[CashflowEvent])
async def list_cashflow_events(
    account_id: Optional[int] = Query(default=None, description="Filter by account ID"),
    start_date: Optional[date] = Query(default=None, description="Filter by start date"),
    end_date: Optional[date] = Query(default=None, description="Filter by end date"),
    db: aiosqlite.Connection = Depends(get_db)
):
    """List cashflow events with optional filters."""
    query = "SELECT id, account_id, amount, kind, date, description, created_at FROM cashflow_events WHERE 1=1"
    params = []

    if account_id is not None:
        query += " AND account_id = ?"
        params.append(account_id)

    if start_date is not None:
        query += " AND date >= ?"
        params.append(start_date)

    if end_date is not None:
        query += " AND date <= ?"
        params.append(end_date)

    query += " ORDER BY date ASC"

    async with db.execute(query, params) as cursor:
        rows = await cursor.fetchall()

    return [
        CashflowEvent(
            id=row[0],
            account_id=row[1],
            amount=row[2],
            kind=row[3],
            date=row[4],
            description=row[5],
            created_at=row[6]
        )
        for row in rows
    ]


@router.post("/cashflow", response_model=CashflowEvent, status_code=201)
async def create_cashflow_event(
    event: CashflowEventCreate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Create a new cashflow event."""
    query = """
        INSERT INTO cashflow_events (account_id, amount, kind, date, description)
        VALUES (?, ?, ?, ?, ?)
    """

    async with db.execute(
        query,
        [
            event.account_id,
            event.amount,
            event.kind,
            event.date,
            event.description
        ]
    ) as cursor:
        event_id = cursor.lastrowid

    await db.commit()

    # Fetch and return created event
    async with db.execute(
        "SELECT id, account_id, amount, kind, date, description, created_at FROM cashflow_events WHERE id = ?",
        [event_id]
    ) as cursor:
        row = await cursor.fetchone()

    return CashflowEvent(
        id=row[0],
        account_id=row[1],
        amount=row[2],
        kind=row[3],
        date=row[4],
        description=row[5],
        created_at=row[6]
    )


@router.delete("/cashflow/{event_id}", status_code=204)
async def delete_cashflow_event(
    event_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Delete a cashflow event."""
    query = "DELETE FROM cashflow_events WHERE id = ?"

    async with db.execute(query, [event_id]) as cursor:
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Cashflow event not found")

    await db.commit()


# ==================== LIMIT WINDOWS ====================

@router.get("/accounts/{account_id}/limit-windows", response_model=List[LimitWindow])
async def list_limit_windows(
    account_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """List all limit windows for an account."""
    query = """
        SELECT id, account_id, start_date, end_date, available_amount, notes
        FROM limit_windows
        WHERE account_id = ?
        ORDER BY start_date DESC
    """

    async with db.execute(query, [account_id]) as cursor:
        rows = await cursor.fetchall()

    return [
        LimitWindow(
            id=row[0],
            account_id=row[1],
            start_date=row[2],
            end_date=row[3],
            available_amount=row[4],
            notes=row[5]
        )
        for row in rows
    ]


@router.post("/accounts/{account_id}/limit-windows", response_model=LimitWindow, status_code=201)
async def create_limit_window(
    account_id: int,
    window: LimitWindowCreate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Create a new limit window."""
    if window.account_id != account_id:
        raise HTTPException(status_code=400, detail="Account ID mismatch")

    query = """
        INSERT INTO limit_windows (account_id, start_date, end_date, available_amount, notes)
        VALUES (?, ?, ?, ?, ?)
    """

    async with db.execute(
        query,
        [
            window.account_id,
            window.start_date,
            window.end_date,
            window.available_amount,
            window.notes
        ]
    ) as cursor:
        window_id = cursor.lastrowid

    await db.commit()

    # Fetch and return created window
    async with db.execute(
        "SELECT id, account_id, start_date, end_date, available_amount, notes FROM limit_windows WHERE id = ?",
        [window_id]
    ) as cursor:
        row = await cursor.fetchone()

    return LimitWindow(
        id=row[0],
        account_id=row[1],
        start_date=row[2],
        end_date=row[3],
        available_amount=row[4],
        notes=row[5]
    )


@router.delete("/limit-windows/{window_id}", status_code=204)
async def delete_limit_window(
    window_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Delete a limit window."""
    query = "DELETE FROM limit_windows WHERE id = ?"

    async with db.execute(query, [window_id]) as cursor:
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Limit window not found")

    await db.commit()
