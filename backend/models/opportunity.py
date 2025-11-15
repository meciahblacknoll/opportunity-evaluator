"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
Referenced: backend/db/schema.sql
Author: Claude Code

Pydantic models for opportunity data validation and serialization.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class OpportunityBase(BaseModel):
    """Base opportunity model with core fields."""
    name: str = Field(..., min_length=1, max_length=255)
    initial_investment: float = Field(default=0.0, ge=0)
    expected_return: float = Field(..., gt=0)
    turnaround_days: int = Field(..., gt=0)
    time_required_hours: int = Field(..., ge=0)
    hourly_rate: float = Field(..., gt=0)
    risk_factor: float = Field(..., ge=0.0, le=1.0)
    certainty_score: float = Field(..., ge=0.0, le=1.0)

    # Phase 1 additions (ChatGPT feedback)
    category: Optional[str] = None
    effort_hours: Optional[int] = None
    is_recurring: bool = False
    liquidation_risk: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    max_capital_allowed: Optional[int] = Field(default=None, ge=0)
    scaling_limit: Optional[int] = Field(default=None, ge=1)


class OpportunityCreate(OpportunityBase):
    """Model for creating a new opportunity."""
    pass


class OpportunityUpdate(BaseModel):
    """Model for updating an existing opportunity (all fields optional)."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    initial_investment: Optional[float] = Field(default=None, ge=0)
    expected_return: Optional[float] = Field(default=None, gt=0)
    turnaround_days: Optional[int] = Field(default=None, gt=0)
    time_required_hours: Optional[int] = Field(default=None, ge=0)
    hourly_rate: Optional[float] = Field(default=None, gt=0)
    risk_factor: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    certainty_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    category: Optional[str] = None
    effort_hours: Optional[int] = None
    is_recurring: Optional[bool] = None
    liquidation_risk: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    max_capital_allowed: Optional[int] = Field(default=None, ge=0)
    scaling_limit: Optional[int] = Field(default=None, ge=1)


class Opportunity(OpportunityBase):
    """Complete opportunity model including database fields."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ComputedMetrics(BaseModel):
    """Model for computed metrics from the database view."""
    id: int
    name: str
    category: Optional[str]
    initial_investment: float
    expected_return: float
    turnaround_days: int
    time_required_hours: int
    hourly_rate: float
    risk_factor: float
    certainty_score: float
    is_recurring: bool
    liquidation_risk: Optional[float]
    max_capital_allowed: Optional[int]
    scaling_limit: Optional[int]

    # Computed fields
    profit: float
    daily_roi_pct: float
    risk_adjusted_roi: float
    opportunity_cost: float

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RankedOpportunity(BaseModel):
    """Model for ranked opportunities with composite score."""
    id: int
    name: str
    category: Optional[str]

    # Base metrics
    profit: float
    daily_roi_pct: float
    risk_adjusted_roi: float
    opportunity_cost: float
    certainty_score: float
    is_recurring: bool
    liquidation_risk: Optional[float]

    # Normalized scores (0-1 scale)
    scored_roi: float
    scored_cost: float
    scored_certainty: float

    # Final composite score
    composite_score: float

    class Config:
        from_attributes = True


class MetricsDebug(BaseModel):
    """Debug model for /metrics endpoint - shows raw computation details."""
    opportunity_id: int
    opportunity_name: str

    # Raw inputs
    initial_investment: float
    expected_return: float
    turnaround_days: int
    time_required_hours: int
    hourly_rate: float
    risk_factor: float
    certainty_score: float

    # Step-by-step computations
    profit: float
    daily_roi_pct: float
    daily_roi_pct_formula: str
    risk_adjusted_roi: float
    risk_adjusted_roi_formula: str
    opportunity_cost: float
    opportunity_cost_formula: str

    # Normalization details
    scored_roi: float
    scored_cost: float
    scored_certainty: float

    # Final score
    composite_score: float
    composite_score_formula: str
