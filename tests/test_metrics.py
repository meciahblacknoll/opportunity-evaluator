"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
Referenced: backend/db/views.sql, CANONICAL TEST EXAMPLE from plan
Author: Claude Code

Unit tests for metric calculations.
Tests all 4 core metrics with canonical examples.
"""

import sqlite3
import pytest
from pathlib import Path


@pytest.fixture
def db_connection():
    """Create a temporary in-memory database for testing."""
    conn = sqlite3.connect(':memory:')
    conn.row_factory = sqlite3.Row

    # Load schema
    schema_path = Path(__file__).parent.parent / 'backend' / 'db' / 'schema.sql'
    with open(schema_path, 'r') as f:
        conn.executescript(f.read())

    # Load views
    views_path = Path(__file__).parent.parent / 'backend' / 'db' / 'views.sql'
    with open(views_path, 'r') as f:
        conn.executescript(f.read())

    yield conn
    conn.close()


def test_daily_roi_percentage_zero_investment(db_connection):
    """Test daily ROI formula with zero initial investment (canonical test case)."""
    # Insert canonical test opportunity
    db_connection.execute("""
        INSERT INTO opportunities (
            name, initial_investment, expected_return, turnaround_days,
            time_required_hours, hourly_rate, risk_factor, certainty_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, ('Test Opp', 0, 3000, 30, 40, 50, 0.2, 0.8))

    # Query computed metrics
    row = db_connection.execute("""
        SELECT profit, daily_roi_pct FROM computed_metrics WHERE name = 'Test Opp'
    """).fetchone()

    profit = row['profit']
    daily_roi_pct = row['daily_roi_pct']

    # Expected: profit = 3000 - 0 = 3000
    assert profit == 3000.0, f"Expected profit 3000, got {profit}"

    # Expected: daily_roi_pct = (3000 / max(0, 1)) / 30 * 100 = 10000.0
    assert abs(daily_roi_pct - 10000.0) < 0.01, f"Expected daily_roi_pct 10000.0, got {daily_roi_pct}"


def test_daily_roi_percentage_with_investment(db_connection):
    """Test daily ROI formula with non-zero initial investment."""
    db_connection.execute("""
        INSERT INTO opportunities (
            name, initial_investment, expected_return, turnaround_days,
            time_required_hours, hourly_rate, risk_factor, certainty_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, ('Investment Opp', 1000, 1500, 60, 10, 50, 0.1, 0.9))

    row = db_connection.execute("""
        SELECT profit, daily_roi_pct FROM computed_metrics WHERE name = 'Investment Opp'
    """).fetchone()

    profit = row['profit']
    daily_roi_pct = row['daily_roi_pct']

    # Expected: profit = 1500 - 1000 = 500
    assert profit == 500.0, f"Expected profit 500, got {profit}"

    # Expected: daily_roi_pct = (500 / 1000) / 60 * 100 = 0.833%
    expected_daily_roi = (500 / 1000) / 60 * 100
    assert abs(daily_roi_pct - expected_daily_roi) < 0.01, \
        f"Expected daily_roi_pct {expected_daily_roi}, got {daily_roi_pct}"


def test_risk_adjusted_roi(db_connection):
    """Test risk-adjusted ROI formula."""
    db_connection.execute("""
        INSERT INTO opportunities (
            name, initial_investment, expected_return, turnaround_days,
            time_required_hours, hourly_rate, risk_factor, certainty_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, ('Risk Test', 0, 3000, 30, 40, 50, 0.2, 0.8))

    row = db_connection.execute("""
        SELECT daily_roi_pct, risk_adjusted_roi FROM computed_metrics WHERE name = 'Risk Test'
    """).fetchone()

    daily_roi_pct = row['daily_roi_pct']
    risk_adjusted_roi = row['risk_adjusted_roi']

    # Expected: risk_adjusted_roi = 10000.0 * (1 - 0.2) = 8000.0
    expected_risk_adj = daily_roi_pct * (1 - 0.2)
    assert abs(risk_adjusted_roi - expected_risk_adj) < 0.01, \
        f"Expected risk_adjusted_roi {expected_risk_adj}, got {risk_adjusted_roi}"


def test_opportunity_cost(db_connection):
    """Test opportunity cost formula (time-based)."""
    db_connection.execute("""
        INSERT INTO opportunities (
            name, initial_investment, expected_return, turnaround_days,
            time_required_hours, hourly_rate, risk_factor, certainty_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, ('Cost Test', 0, 3000, 30, 40, 50, 0.2, 0.8))

    row = db_connection.execute("""
        SELECT opportunity_cost FROM computed_metrics WHERE name = 'Cost Test'
    """).fetchone()

    opportunity_cost = row['opportunity_cost']

    # Expected: opportunity_cost = 40 * 50 = 2000
    assert opportunity_cost == 2000.0, f"Expected opportunity_cost 2000, got {opportunity_cost}"


def test_composite_score_normalization(db_connection):
    """Test that composite score is normalized and weighted correctly."""
    # Insert multiple opportunities to test normalization
    opportunities = [
        ('Opp A', 0, 1000, 30, 10, 50, 0.1, 0.9),
        ('Opp B', 500, 1500, 60, 20, 50, 0.3, 0.7),
        ('Opp C', 1000, 2000, 90, 30, 50, 0.5, 0.5),
    ]

    for opp in opportunities:
        db_connection.execute("""
            INSERT INTO opportunities (
                name, initial_investment, expected_return, turnaround_days,
                time_required_hours, hourly_rate, risk_factor, certainty_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, opp)

    # Query ranked opportunities
    rows = db_connection.execute("""
        SELECT
            name, scored_roi, scored_cost, scored_certainty, composite_score
        FROM ranked_opportunities
    """).fetchall()

    assert len(rows) == 3, "Expected 3 opportunities in ranked results"

    for row in rows:
        scored_roi = row['scored_roi']
        scored_cost = row['scored_cost']
        scored_certainty = row['scored_certainty']
        composite_score = row['composite_score']

        # All normalized scores should be between 0 and 1
        assert 0 <= scored_roi <= 1, f"scored_roi out of range: {scored_roi}"
        assert 0 <= scored_cost <= 1, f"scored_cost out of range: {scored_cost}"
        assert 0 <= scored_certainty <= 1, f"scored_certainty out of range: {scored_certainty}"

        # Composite score should be weighted sum
        expected_composite = (scored_roi * 0.5) + (scored_cost * 0.3) + (scored_certainty * 0.2)
        assert abs(composite_score - expected_composite) < 0.001, \
            f"Composite score mismatch for {row['name']}: expected {expected_composite}, got {composite_score}"


def test_zero_opportunity_cost_edge_case(db_connection):
    """Test that zero opportunity cost is handled correctly (max safeguard)."""
    db_connection.execute("""
        INSERT INTO opportunities (
            name, initial_investment, expected_return, turnaround_days,
            time_required_hours, hourly_rate, risk_factor, certainty_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, ('Zero Cost', 0, 1000, 30, 0, 50, 0.1, 0.9))

    row = db_connection.execute("""
        SELECT opportunity_cost FROM computed_metrics WHERE name = 'Zero Cost'
    """).fetchone()

    opportunity_cost = row['opportunity_cost']

    # Expected: 0 * 50 = 0
    assert opportunity_cost == 0.0, f"Expected opportunity_cost 0, got {opportunity_cost}"

    # Ensure the ranked view doesn't crash with division by zero
    ranked_row = db_connection.execute("""
        SELECT composite_score FROM ranked_opportunities WHERE name = 'Zero Cost'
    """).fetchone()

    # Should have a composite score (protected by max(opportunity_cost, 1) in normalization)
    assert ranked_row['composite_score'] is not None, "Composite score should not be null"
