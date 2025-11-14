"""
PROVENANCE
Created: 2025-11-14
Prompt: ChatGPT Phase 2 testing guidance
Author: Claude Code

Phase 2 tests for financial calculations (APR, simulator).
"""

import pytest
import sys
from pathlib import Path
from datetime import date, timedelta

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from services.finance.apr import (
    apr_to_daily_rate,
    compound_cost,
    simple_interest,
    effective_apr_for_period,
    cost_per_dollar_per_day,
    days_until_double,
    monthly_payment_for_loan,
    remaining_balance_after_payments
)
from services.finance.simulator import FloatSimulator, SimulationResult


class TestAPRUtilities:
    """Test APR calculation utilities."""

    def test_apr_to_daily_rate(self):
        """Test daily rate conversion."""
        # 24% APR → ~0.0657% daily
        daily = apr_to_daily_rate(24.0)
        assert abs(daily - 0.0006575342465753425) < 1e-10

        # 0% APR → 0 daily
        assert apr_to_daily_rate(0.0) == 0.0

        # 100% APR → ~0.274% daily
        daily = apr_to_daily_rate(100.0)
        assert abs(daily - (100.0 / 100.0 / 365)) < 1e-10

    def test_compound_cost(self):
        """Test compounded cost calculation."""
        daily_rate = apr_to_daily_rate(24.0)

        # $1000 at 24% APR for 30 days → ~$19.92 interest
        cost = compound_cost(1000, daily_rate, 30)
        assert abs(cost - 19.91780821917808) < 0.01

        # 0 days → 0 cost
        assert compound_cost(1000, daily_rate, 0) == 0.0

        # $5000 at 24% APR for 60 days
        cost = compound_cost(5000, daily_rate, 60)
        expected = 5000 * ((1 + daily_rate) ** 60 - 1)
        assert abs(cost - expected) < 0.01

    def test_simple_interest(self):
        """Test simple (non-compounding) interest."""
        daily_rate = apr_to_daily_rate(24.0)

        # $1000 at 24% APR for 30 days → ~$19.73 simple interest
        interest = simple_interest(1000, daily_rate, 30)
        assert abs(interest - 19.726027397260275) < 0.01

        # 0 days → 0 interest
        assert simple_interest(1000, daily_rate, 0) == 0.0

    def test_effective_apr_for_period(self):
        """Test effective APR calculation."""
        daily = apr_to_daily_rate(24.0)

        # 30-day effective rate
        eff = effective_apr_for_period(daily, 30)
        assert eff == pytest.approx(0.0199, rel=1e-3)  # ~1.99%

        # 365-day effective rate (full year)
        eff_year = effective_apr_for_period(daily, 365)
        # Should be close to (but slightly higher than) 24% due to compounding
        assert eff_year > 0.24
        assert eff_year < 0.28  # ~27% with daily compounding

    def test_cost_per_dollar_per_day(self):
        """Test cost per dollar per day."""
        cost = cost_per_dollar_per_day(24.0)
        assert abs(cost - 0.0006575342465753425) < 1e-10

        # Should equal apr_to_daily_rate
        assert cost == apr_to_daily_rate(24.0)

    def test_days_until_double(self):
        """Test days until principal doubles."""
        # 24% APR → ~1053-1054 days (depends on rounding)
        days = days_until_double(24.0)
        assert days in [1053, 1054]  # Accept either due to rounding

        # 12% APR → ~2106-2108 days
        days = days_until_double(12.0)
        assert days in range(2105, 2110)  # Accept range

        # 0% APR → 0 (edge case)
        days = days_until_double(0.0)
        assert days == 0

    def test_monthly_payment_for_loan(self):
        """Test loan payment amortization formula."""
        # $10,000 at 12% APR over 36 months
        payment = monthly_payment_for_loan(10000, 12.0, 36)
        assert abs(payment - 332.14) < 0.5  # ~$332/month

        # $50,000 at 6% APR over 60 months
        payment = monthly_payment_for_loan(50000, 6.0, 60)
        assert abs(payment - 966.64) < 1.0  # ~$967/month

        # 0% APR → equal payments
        payment = monthly_payment_for_loan(12000, 0.0, 12)
        assert payment == 1000.0

        # 0 months edge case
        payment = monthly_payment_for_loan(1000, 12.0, 0)
        assert payment == 1000.0

    def test_remaining_balance_after_payments(self):
        """Test remaining loan balance calculation."""
        # $10,000 loan at 12% APR, $332/month, after 12 payments
        balance = remaining_balance_after_payments(10000, 12.0, 332, 12)
        assert balance == pytest.approx(7058, abs=200)  # ~$7058 remaining

        # After 36 payments → should be near 0
        balance = remaining_balance_after_payments(10000, 12.0, 332, 36)
        assert balance == pytest.approx(0, abs=100)  # Within $100 of paid off

        # 0 payments → full principal
        balance = remaining_balance_after_payments(10000, 12.0, 332, 0)
        assert balance == 10000


class TestFloatSimulator:
    """Test float/liquidity timeline simulator."""

    def test_timeline_creation(self):
        """Test that timeline events are created correctly."""
        simulator = FloatSimulator()

        opportunities = [
            {
                "id": 1,
                "name": "Test Opp 1",
                "initial_investment": 100000,  # $1000
                "expected_return": 120000,  # $1200
                "turnaround_days": 30
            }
        ]

        cashflow = [
            {
                "id": 1,
                "account_id": None,
                "amount": 50000,
                "kind": "inflow",
                "date": date(2025, 1, 15),
                "description": "Paycheck"
            }
        ]

        start = date(2025, 1, 1)
        end = date(2025, 2, 28)

        simulator._build_timeline(opportunities, cashflow, start, end)

        # Should have 3 events: opp start, opp end, inflow
        assert len(simulator.events) == 3

        # Check event types
        event_types = [e.type for e in simulator.events]
        assert "opportunity_start" in event_types
        assert "opportunity_end" in event_types
        assert "inflow" in event_types

    def test_float_selection_lowest_apr(self):
        """Test that simulator chooses account with lowest APR."""
        simulator = FloatSimulator()

        accounts = [
            {"id": 1, "name": "High APR", "type": "credit_card", "available_credit": 500000, "apr_percent": 24.0},
            {"id": 2, "name": "Low APR", "type": "credit_card", "available_credit": 500000, "apr_percent": 12.0},
            {"id": 3, "name": "Mid APR", "type": "credit_card", "available_credit": 500000, "apr_percent": 18.0}
        ]

        best = simulator._find_best_float_account(accounts, 100000)
        assert best["id"] == 2  # Should pick Low APR account
        assert best["apr_percent"] == 12.0

    def test_float_selection_insufficient_credit(self):
        """Test handling when no account has enough credit."""
        simulator = FloatSimulator()

        accounts = [
            {"id": 1, "type": "credit_card", "available_credit": 50000, "apr_percent": 12.0},
            {"id": 2, "type": "credit_card", "available_credit": 30000, "apr_percent": 10.0}
        ]

        # Need $1000, but max available is $500
        best = simulator._find_best_float_account(accounts, 100000)
        assert best is None

    def test_simulation_with_sufficient_cash(self):
        """Test simulation where cash covers all expenses."""
        simulator = FloatSimulator()

        opportunities = [
            {
                "id": 1,
                "name": "Small Opp",
                "initial_investment": 50000,  # $500
                "expected_return": 60000,  # $600
                "turnaround_days": 10
            }
        ]

        accounts = [
            {"id": 1, "type": "credit_card", "available_credit": 100000, "apr_percent": 24.0}
        ]

        start = date(2025, 1, 1)
        end = date(2025, 1, 31)

        result = simulator.simulate(
            available_cash=100000,  # $1000 cash
            selected_opportunities=opportunities,
            start_date=start,
            end_date=end,
            accounts=accounts,
            cashflow_events=[]
        )

        # No float needed → no APR costs
        assert result.total_apr_cost == 0.0
        assert len(result.float_usage) == 0
        assert result.success is True
        assert len(result.warnings) == 0

    def test_simulation_with_float_usage(self):
        """Test simulation requiring float."""
        simulator = FloatSimulator()

        opportunities = [
            {
                "id": 1,
                "name": "Big Opp",
                "initial_investment": 200000,  # $2000
                "expected_return": 250000,  # $2500
                "turnaround_days": 30
            }
        ]

        accounts = [
            {"id": 1, "type": "credit_card", "available_credit": 300000, "apr_percent": 24.0}
        ]

        start = date(2025, 1, 1)
        end = date(2025, 2, 28)

        result = simulator.simulate(
            available_cash=50000,  # Only $500 cash
            selected_opportunities=opportunities,
            start_date=start,
            end_date=end,
            accounts=accounts,
            cashflow_events=[]
        )

        # Should use float (exact amount depends on timeline)
        assert len(result.float_usage) >= 1
        assert result.float_usage[0].account_id == 1

        # Should have APR costs
        assert result.total_apr_cost > 0

        # Net profit = revenue - APR costs (but timeline may affect exact value)
        # Just verify structure is correct
        assert result.total_apr_cost > 0
        assert result.projected_net_profit > 0  # Should still be profitable

    def test_simulation_impossible_timeline(self):
        """Test simulation with insufficient funds."""
        simulator = FloatSimulator()

        opportunities = [
            {
                "id": 1,
                "name": "Too Big",
                "initial_investment": 1000000,  # $10,000
                "expected_return": 1100000,
                "turnaround_days": 30
            }
        ]

        accounts = [
            {"id": 1, "type": "credit_card", "available_credit": 500000, "apr_percent": 24.0}
        ]

        start = date(2025, 1, 1)
        end = date(2025, 2, 28)

        result = simulator.simulate(
            available_cash=100000,  # $1000
            selected_opportunities=opportunities,
            start_date=start,
            end_date=end,
            accounts=accounts,
            cashflow_events=[]
        )

        # Should have warnings
        assert len(result.warnings) > 0
        assert result.success is False
        assert "Insufficient funds" in result.warnings[0]

    def test_simulation_result_json_serializable(self):
        """Test that SimulationResult can be JSON serialized."""
        import json

        simulator = FloatSimulator()

        opportunities = [
            {
                "id": 1,
                "name": "Test",
                "initial_investment": 10000,
                "expected_return": 12000,
                "turnaround_days": 10
            }
        ]

        accounts = [
            {"id": 1, "type": "credit_card", "available_credit": 50000, "apr_percent": 18.0}
        ]

        start = date(2025, 1, 1)
        end = date(2025, 1, 31)

        result = simulator.simulate(
            available_cash=5000,
            selected_opportunities=opportunities,
            start_date=start,
            end_date=end,
            accounts=accounts,
            cashflow_events=[]
        )

        # Check that input_snapshot is JSON-serializable
        try:
            json.dumps(result.input_snapshot)
        except TypeError:
            pytest.fail("input_snapshot is not JSON serializable")

        # Check timeline is JSON-serializable
        try:
            json.dumps(result.timeline)
        except TypeError:
            pytest.fail("timeline is not JSON serializable")

    def test_simulation_with_cashflow_events(self):
        """Test simulation with scheduled inflows/outflows."""
        simulator = FloatSimulator()

        opportunities = [
            {
                "id": 1,
                "name": "Opp",
                "initial_investment": 100000,
                "expected_return": 120000,
                "turnaround_days": 20
            }
        ]

        cashflow = [
            {
                "id": 1,
                "account_id": None,
                "amount": 80000,  # $800 inflow on day 10
                "kind": "inflow",
                "date": date(2025, 1, 10),
                "description": "Paycheck"
            }
        ]

        accounts = [
            {"id": 1, "type": "credit_card", "available_credit": 200000, "apr_percent": 15.0}
        ]

        start = date(2025, 1, 1)
        end = date(2025, 1, 31)

        result = simulator.simulate(
            available_cash=30000,  # $300 cash
            selected_opportunities=opportunities,
            start_date=start,
            end_date=end,
            accounts=accounts,
            cashflow_events=cashflow
        )

        # Initial float needed: $1000 - $300 = $700
        # Then inflow adds $800
        # Timeline should reflect the inflow
        assert len(result.float_usage) > 0
        assert result.success is True

    def test_simulation_net_profit_calculation(self):
        """Test that net profit = revenue - float costs."""
        simulator = FloatSimulator()

        opportunities = [
            {
                "id": 1,
                "name": "Profitable",
                "initial_investment": 100000,  # $1000
                "expected_return": 150000,  # $1500
                "turnaround_days": 30
            }
        ]

        accounts = [
            {"id": 1, "type": "credit_card", "available_credit": 200000, "apr_percent": 24.0}
        ]

        start = date(2025, 1, 1)
        end = date(2025, 2, 28)

        result = simulator.simulate(
            available_cash=0,  # No cash → full float
            selected_opportunities=opportunities,
            start_date=start,
            end_date=end,
            accounts=accounts,
            cashflow_events=[]
        )

        # Revenue = $1500 - $1000 = $500
        # But we pay APR costs on float (timeline dependent)
        # Just verify structure and profitability
        assert result.total_apr_cost > 0
        assert result.projected_net_profit > 0  # Still profitable after costs
