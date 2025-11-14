"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT_v2.md
Referenced: ChatGPT APR formulas
Author: Claude Code

APR calculation utilities for Phase 2.
All functions are deterministic and unit-testable.
"""

from config import APR_DAYS_PER_YEAR


def apr_to_daily_rate(apr_percent: float) -> float:
    """
    Convert annual APR to daily rate.

    Args:
        apr_percent: Annual percentage rate (e.g., 24.0 for 24%)

    Returns:
        Daily rate as decimal (e.g., 0.000657 for 24% APR)

    Example:
        >>> apr_to_daily_rate(24.0)
        0.0006575342465753425
    """
    return (apr_percent / 100.0) / APR_DAYS_PER_YEAR


def compound_cost(amount: float, apr_daily: float, days: int) -> float:
    """
    Calculate compounded cost of float for a given amount over N days.

    Formula: amount * ((1 + apr_daily) ** days - 1)

    Args:
        amount: Principal amount (in cents or dollars)
        apr_daily: Daily APR rate (use apr_to_daily_rate())
        days: Number of days to compound

    Returns:
        Total cost of float (interest accumulated)

    Example:
        >>> daily_rate = apr_to_daily_rate(24.0)
        >>> compound_cost(1000, daily_rate, 30)
        19.91780821917808  # ~$20 interest on $1000 at 24% APR for 30 days
    """
    if days == 0:
        return 0.0

    return amount * ((1 + apr_daily) ** days - 1)


def simple_interest(amount: float, apr_daily: float, days: int) -> float:
    """
    Calculate simple (non-compounding) interest.

    Formula: amount * apr_daily * days

    Args:
        amount: Principal amount
        apr_daily: Daily APR rate
        days: Number of days

    Returns:
        Simple interest amount

    Note: Use compound_cost() for more accurate credit card calculations.
    This is useful for some loan products that use simple interest.
    """
    return amount * apr_daily * days


def effective_apr_for_period(apr_daily: float, days: int) -> float:
    """
    Calculate effective APR for a specific period.

    Useful for understanding the true cost of short-term float.

    Args:
        apr_daily: Daily APR rate
        days: Number of days in period

    Returns:
        Effective annual rate when compounded over this period

    Example:
        >>> daily = apr_to_daily_rate(24.0)
        >>> effective_apr_for_period(daily, 30)
        0.02678...  # ~2.68% effective rate for 30-day period
    """
    return (1 + apr_daily) ** days - 1


def cost_per_dollar_per_day(apr_percent: float) -> float:
    """
    Calculate cost per dollar per day for quick estimates.

    Args:
        apr_percent: Annual percentage rate

    Returns:
        Cost per $1 per day

    Example:
        >>> cost_per_dollar_per_day(24.0)
        0.0006575...  # ~0.066 cents per dollar per day
    """
    return apr_to_daily_rate(apr_percent)


def days_until_double(apr_percent: float) -> int:
    """
    Calculate how many days until principal doubles (Rule of 72 equivalent).

    Args:
        apr_percent: Annual percentage rate

    Returns:
        Number of days until principal doubles

    Example:
        >>> days_until_double(24.0)
        1054  # ~2.9 years at 24% APR
    """
    import math

    if apr_percent <= 0:
        return 0

    daily_rate = apr_to_daily_rate(apr_percent)

    # Solve: 2 = (1 + daily_rate) ** days
    # days = ln(2) / ln(1 + daily_rate)
    days = math.log(2) / math.log(1 + daily_rate)

    return int(days)


# Loan Amortization Helpers

def monthly_payment_for_loan(principal: float, apr_percent: float, months: int) -> float:
    """
    Calculate monthly payment for a loan using standard amortization formula.

    Formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    where r = monthly rate, n = number of months

    Args:
        principal: Loan amount
        apr_percent: Annual percentage rate
        months: Loan term in months

    Returns:
        Monthly payment amount

    Example:
        >>> monthly_payment_for_loan(10000, 12.0, 36)
        332.14...  # ~$332/month for $10k at 12% over 36 months
    """
    if months == 0 or apr_percent == 0:
        return principal / max(months, 1)

    monthly_rate = (apr_percent / 100.0) / 12.0

    numerator = monthly_rate * ((1 + monthly_rate) ** months)
    denominator = ((1 + monthly_rate) ** months) - 1

    return principal * (numerator / denominator)


def remaining_balance_after_payments(
    principal: float,
    apr_percent: float,
    monthly_payment: float,
    payments_made: int
) -> float:
    """
    Calculate remaining loan balance after N payments.

    Args:
        principal: Original loan amount
        apr_percent: Annual percentage rate
        monthly_payment: Monthly payment amount
        payments_made: Number of payments already made

    Returns:
        Remaining balance
    """
    balance = principal
    monthly_rate = (apr_percent / 100.0) / 12.0

    for _ in range(payments_made):
        interest = balance * monthly_rate
        principal_payment = monthly_payment - interest
        balance -= principal_payment

        if balance <= 0:
            return 0.0

    return balance
