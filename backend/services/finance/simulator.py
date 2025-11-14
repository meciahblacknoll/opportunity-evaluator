"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT_v2.md
Referenced: ChatGPT simulation spec
Author: Claude Code

Float/liquidity timeline simulator for Phase 2.
Deterministic simulation of cashflow and opportunity execution.
"""

from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from services.finance.apr import apr_to_daily_rate, compound_cost


@dataclass
class TimelineEvent:
    """Event in the simulation timeline."""
    date: date
    type: str  # 'inflow', 'outflow', 'opportunity_start', 'opportunity_end', 'cycle_due',
               # 'statement_close', 'loan_payment', 'limit_window_start', 'limit_window_end'
    amount: int
    description: str
    account_id: Optional[int] = None


@dataclass
class FloatUsage:
    """Track float usage per account."""
    account_id: int
    amount_used: int
    start_date: date
    end_date: date
    apr_percent: float
    total_cost: float


@dataclass
class SimulationResult:
    """Result of a float simulation."""
    input_snapshot: Dict[str, Any]
    timeline: List[Dict[str, Any]]  # Daily balance snapshots
    float_usage: List[FloatUsage]
    total_apr_cost: float
    projected_net_profit: float
    warnings: List[str]
    success: bool


class FloatSimulator:
    """Simulates opportunity execution with float and APR costs."""

    def __init__(self):
        self.events: List[TimelineEvent] = []
        self.warnings: List[str] = []

    def simulate(
        self,
        available_cash: int,
        selected_opportunities: List[Dict[str, Any]],
        start_date: date,
        end_date: date,
        accounts: List[Dict[str, Any]],
        cashflow_events: List[Dict[str, Any]],
        limit_windows: Optional[List[Dict[str, Any]]] = None,
        credit_card_cycles: Optional[List[Dict[str, Any]]] = None,
        loan_terms: Optional[List[Dict[str, Any]]] = None
    ) -> SimulationResult:
        """
        Run deterministic float simulation.

        Args:
            available_cash: Starting cash available (in cents)
            selected_opportunities: List of opportunities to execute
            start_date: Simulation start date
            end_date: Simulation end date
            accounts: Available accounts for float
            cashflow_events: Scheduled inflows/outflows
            limit_windows: Available credit windows (optional)
            credit_card_cycles: Credit card billing cycles (optional)
            loan_terms: Loan payment schedules (optional)

        Returns:
            SimulationResult with timeline and costs
        """
        # Save input snapshot for provenance
        input_snapshot = {
            "available_cash": available_cash,
            "opportunity_ids": [o.get("id") for o in selected_opportunities],
            "start_date": str(start_date),
            "end_date": str(end_date),
            "num_accounts": len(accounts),
            "num_cashflow_events": len(cashflow_events)
        }

        # Build event timeline
        self._build_timeline(selected_opportunities, cashflow_events, start_date, end_date)

        # Sort events chronologically
        self.events.sort(key=lambda e: e.date)

        # Run day-by-day simulation
        timeline = []
        current_balance = available_cash
        float_usage = []

        current_date = start_date
        while current_date <= end_date:
            # Process all events for this date
            daily_events = [e for e in self.events if e.date == current_date]

            for event in daily_events:
                if event.type == "inflow":
                    current_balance += event.amount
                elif event.type in ["outflow", "opportunity_start"]:
                    if current_balance >= event.amount:
                        # Use cash
                        current_balance -= event.amount
                    else:
                        # Need float - use credit
                        needed = event.amount - current_balance
                        current_balance = 0

                        # Find best account (lowest APR with available credit)
                        best_account = self._find_best_float_account(accounts, needed)

                        if best_account:
                            # Track float usage
                            float_usage.append(self._create_float_usage(
                                best_account,
                                needed,
                                current_date,
                                end_date
                            ))
                        else:
                            self.warnings.append(
                                f"Insufficient funds on {current_date}: needed ${needed/100:.2f}"
                            )

                elif event.type == "opportunity_end":
                    # Opportunity pays out
                    current_balance += event.amount

            # Snapshot current state
            timeline.append({
                "date": str(current_date),
                "balance": current_balance,
                "events": len(daily_events),
                "descriptions": [e.description for e in daily_events]
            })

            current_date += timedelta(days=1)

        # Calculate total APR costs
        total_apr_cost = sum(fu.total_cost for fu in float_usage)

        # Calculate net profit (revenue - float costs)
        total_revenue = sum(
            e.amount for e in self.events
            if e.type == "opportunity_end"
        )
        projected_net_profit = total_revenue - total_apr_cost

        # Check for warnings
        if current_balance < 0:
            self.warnings.append("Ended simulation with negative balance")

        return SimulationResult(
            input_snapshot=input_snapshot,
            timeline=timeline,
            float_usage=float_usage,
            total_apr_cost=total_apr_cost,
            projected_net_profit=projected_net_profit,
            warnings=self.warnings,
            success=len(self.warnings) == 0
        )

    def _build_timeline(
        self,
        opportunities: List[Dict[str, Any]],
        cashflow_events: List[Dict[str, Any]],
        start_date: date,
        end_date: date
    ):
        """Build timeline of all events."""
        # Add opportunity events
        for opp in opportunities:
            # Start: spend required
            if opp.get("initial_investment", 0) > 0:
                self.events.append(TimelineEvent(
                    date=start_date,
                    type="opportunity_start",
                    amount=opp["initial_investment"],
                    description=f"Start: {opp['name']}"
                ))

            # End: payout
            payout_date = start_date + timedelta(days=opp.get("turnaround_days", 30))
            if payout_date <= end_date:
                self.events.append(TimelineEvent(
                    date=payout_date,
                    type="opportunity_end",
                    amount=opp["expected_return"],
                    description=f"Payout: {opp['name']}"
                ))

        # Add cashflow events
        for cf in cashflow_events:
            event_date = cf.get("date")
            if isinstance(event_date, str):
                event_date = date.fromisoformat(event_date)

            if start_date <= event_date <= end_date:
                self.events.append(TimelineEvent(
                    date=event_date,
                    type=cf["kind"],
                    amount=cf["amount"],
                    description=cf.get("description", cf["kind"]),
                    account_id=cf.get("account_id")
                ))

    def _find_best_float_account(
        self,
        accounts: List[Dict[str, Any]],
        amount_needed: int
    ) -> Optional[Dict[str, Any]]:
        """Find account with lowest APR that has available credit."""
        eligible = [
            a for a in accounts
            if a.get("available_credit", 0) >= amount_needed
            and a.get("type") == "credit_card"
        ]

        if not eligible:
            return None

        # Return account with lowest APR
        return min(eligible, key=lambda a: a.get("apr_percent", 999))

    def _create_float_usage(
        self,
        account: Dict[str, Any],
        amount: int,
        start: date,
        end: date
    ) -> FloatUsage:
        """Create float usage record with APR cost."""
        days = (end - start).days
        apr_percent = account.get("apr_percent", 0.0)
        daily_rate = apr_to_daily_rate(apr_percent)

        # Calculate compounded cost
        cost = compound_cost(amount, daily_rate, days)

        return FloatUsage(
            account_id=account["id"],
            amount_used=amount,
            start_date=start,
            end_date=end,
            apr_percent=apr_percent,
            total_cost=cost
        )
