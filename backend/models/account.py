"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT_v2.md
Referenced: backend/db/schema_v2.sql
Author: Claude Code

Pydantic models for Phase 2 financial entities.
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class AccountType(str, Enum):
    """Account type enumeration."""
    CREDIT_CARD = "credit_card"
    BANK_ACCOUNT = "bank_account"
    LOAN = "loan"
    LINE_OF_CREDIT = "line_of_credit"


class RewardType(str, Enum):
    """Reward type enumeration."""
    CASH = "cash"
    POINTS = "points"
    STATEMENT_CREDIT = "statement_credit"


class CashflowKind(str, Enum):
    """Cashflow event kind."""
    INFLOW = "inflow"
    OUTFLOW = "outflow"


# Account Models

class AccountBase(BaseModel):
    """Base account model."""
    name: str = Field(..., min_length=1, max_length=255)
    type: AccountType
    credit_limit: int = Field(default=0, ge=0)
    current_balance: int = Field(default=0)
    apr_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    statement_day: Optional[int] = Field(default=None, ge=1, le=31)
    due_day: Optional[int] = Field(default=None, ge=1, le=31)
    available_credit: int = Field(default=0, ge=0)
    notes: Optional[str] = None


class AccountCreate(AccountBase):
    """Model for creating a new account."""
    pass


class Account(AccountBase):
    """Complete account model including database fields."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Credit Card Cycle Models

class CreditCardCycleBase(BaseModel):
    """Base credit card cycle model."""
    account_id: int
    statement_start: date
    statement_end: date
    balance_at_statement: int = Field(default=0)
    min_payment: int = Field(default=0, ge=0)
    due_date: Optional[date] = None


class CreditCardCycleCreate(CreditCardCycleBase):
    """Model for creating a credit card cycle."""
    pass


class CreditCardCycle(CreditCardCycleBase):
    """Complete credit card cycle model."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Loan Term Models

class LoanTermBase(BaseModel):
    """Base loan term model."""
    account_id: int
    principal: int = Field(..., gt=0)
    apr_percent: float = Field(..., ge=0.0, le=100.0)
    compounding_period: str = Field(default="monthly")
    monthly_payment: Optional[int] = Field(default=None, ge=0)
    term_months: Optional[int] = Field(default=None, ge=1)


class LoanTermCreate(LoanTermBase):
    """Model for creating loan terms."""
    pass


class LoanTerm(LoanTermBase):
    """Complete loan term model."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Limit Window Models

class LimitWindowBase(BaseModel):
    """Base limit window model."""
    account_id: int
    start_date: date
    end_date: date
    available_amount: int = Field(..., ge=0)
    notes: Optional[str] = None


class LimitWindowCreate(LimitWindowBase):
    """Model for creating a limit window."""
    pass


class LimitWindow(LimitWindowBase):
    """Complete limit window model."""
    id: int

    class Config:
        from_attributes = True


# Cashflow Event Models

class CashflowEventBase(BaseModel):
    """Base cashflow event model."""
    account_id: Optional[int] = None
    amount: int = Field(..., gt=0)
    kind: CashflowKind
    date: date
    description: Optional[str] = None


class CashflowEventCreate(CashflowEventBase):
    """Model for creating a cashflow event."""
    pass


class CashflowEvent(CashflowEventBase):
    """Complete cashflow event model."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Opportunity Meta Models

class OpportunityMetaBase(BaseModel):
    """Base opportunity metadata model."""
    opportunity_id: int
    is_churn_bonus: bool = False
    min_spend: int = Field(default=0, ge=0)
    reward_amount: int = Field(default=0, ge=0)  # Raw value: cents for cash, points for points
    reward_type: RewardType = RewardType.CASH
    required_accounts: Optional[str] = None  # JSON array string
    expected_payout_days: int = Field(default=0, ge=0)


class OpportunityMetaCreate(OpportunityMetaBase):
    """Model for creating opportunity metadata."""
    pass


class OpportunityMeta(OpportunityMetaBase):
    """Complete opportunity metadata model."""
    created_at: datetime

    class Config:
        from_attributes = True


# ICE Scoring (extends base Opportunity model)

class OpportunityWithICE(BaseModel):
    """Opportunity with ICE scoring fields."""
    impact: int = Field(default=5, ge=0, le=10)
    confidence: int = Field(default=5, ge=0, le=10)
    ease: int = Field(default=5, ge=0, le=10)

    def calculate_ice_score(self) -> float:
        """Calculate raw ICE score."""
        return (self.impact * self.confidence) / max(self.ease, 1)
