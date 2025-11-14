"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
Referenced: backend/api/*.py
Author: Claude Code

Integration tests for FastAPI endpoints.
"""

import pytest
from httpx import AsyncClient
from pathlib import Path
import sys
import os

# Add backend to path
backend_path = Path(__file__).parent.parent / 'backend'
sys.path.insert(0, str(backend_path))

from main import app


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test root endpoint returns API info."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "Opportunity Evaluator" in data["name"]
    assert "endpoints" in data


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_get_recommendations():
    """Test recommendations endpoint returns ranked opportunities."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/recommendations")

    assert response.status_code == 200
    data = response.json()

    # Should return array of opportunities
    assert isinstance(data, list)
    assert len(data) > 0  # Seed data should be loaded

    # Check first opportunity structure
    first_opp = data[0]
    assert "id" in first_opp
    assert "name" in first_opp
    assert "composite_score" in first_opp
    assert "profit" in first_opp
    assert "daily_roi_pct" in first_opp
    assert "risk_adjusted_roi" in first_opp
    assert "opportunity_cost" in first_opp

    # Opportunities should be sorted by composite_score descending
    if len(data) > 1:
        assert data[0]["composite_score"] >= data[1]["composite_score"]


@pytest.mark.asyncio
async def test_get_recommendations_with_limit():
    """Test recommendations endpoint respects limit parameter."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/recommendations?limit=3")

    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 3


@pytest.mark.asyncio
async def test_get_metrics():
    """Test metrics endpoint returns computed metrics."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/metrics")

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) > 0

    # Check structure
    first_metric = data[0]
    assert "id" in first_metric
    assert "name" in first_metric
    assert "profit" in first_metric
    assert "daily_roi_pct" in first_metric
    assert "risk_adjusted_roi" in first_metric
    assert "opportunity_cost" in first_metric


@pytest.mark.asyncio
async def test_get_metrics_debug():
    """Test metrics debug endpoint for specific opportunity."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First get an opportunity ID
        response = await client.get("/api/recommendations?limit=1")
        opp_id = response.json()[0]["id"]

        # Then get debug info
        response = await client.get(f"/api/metrics/debug/{opp_id}")

    assert response.status_code == 200
    data = response.json()

    # Check debug structure includes formulas
    assert "opportunity_id" in data
    assert "opportunity_name" in data
    assert "daily_roi_pct_formula" in data
    assert "risk_adjusted_roi_formula" in data
    assert "opportunity_cost_formula" in data
    assert "composite_score_formula" in data


@pytest.mark.asyncio
async def test_create_opportunity():
    """Test creating a new opportunity."""
    new_opp = {
        "name": "API Test Opportunity",
        "initial_investment": 1000,
        "expected_return": 1500,
        "turnaround_days": 30,
        "time_required_hours": 20,
        "hourly_rate": 50,
        "risk_factor": 0.2,
        "certainty_score": 0.8,
        "category": "Test",
        "is_recurring": False
    }

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/opportunities", json=new_opp)

    assert response.status_code == 201
    data = response.json()

    assert data["name"] == "API Test Opportunity"
    assert "id" in data
    assert data["initial_investment"] == 1000
    assert data["expected_return"] == 1500


@pytest.mark.asyncio
async def test_list_opportunities():
    """Test listing all opportunities."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/opportunities")

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) > 0


@pytest.mark.asyncio
async def test_get_opportunity():
    """Test getting a specific opportunity by ID."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Get first opportunity ID from list
        list_response = await client.get("/api/opportunities")
        first_id = list_response.json()[0]["id"]

        # Get that specific opportunity
        response = await client.get(f"/api/opportunities/{first_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == first_id
    assert "name" in data


@pytest.mark.asyncio
async def test_update_opportunity():
    """Test updating an opportunity."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First create an opportunity
        new_opp = {
            "name": "Update Test",
            "initial_investment": 1000,
            "expected_return": 1500,
            "turnaround_days": 30,
            "time_required_hours": 20,
            "hourly_rate": 50,
            "risk_factor": 0.2,
            "certainty_score": 0.8
        }
        create_response = await client.post("/api/opportunities", json=new_opp)
        opp_id = create_response.json()["id"]

        # Update it
        update_data = {"name": "Updated Name", "expected_return": 2000}
        response = await client.put(f"/api/opportunities/{opp_id}", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["expected_return"] == 2000


@pytest.mark.asyncio
async def test_delete_opportunity():
    """Test deleting an opportunity."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First create an opportunity
        new_opp = {
            "name": "Delete Test",
            "initial_investment": 1000,
            "expected_return": 1500,
            "turnaround_days": 30,
            "time_required_hours": 20,
            "hourly_rate": 50,
            "risk_factor": 0.2,
            "certainty_score": 0.8
        }
        create_response = await client.post("/api/opportunities", json=new_opp)
        opp_id = create_response.json()["id"]

        # Delete it
        response = await client.delete(f"/api/opportunities/{opp_id}")

    assert response.status_code == 204

    # Verify it's gone
    async with AsyncClient(app=app, base_url="http://test") as client:
        get_response = await client.get(f"/api/opportunities/{opp_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_validation_errors():
    """Test that validation errors are properly returned."""
    invalid_opp = {
        "name": "",  # Empty name should fail
        "expected_return": -100,  # Negative should fail
        "turnaround_days": 0,  # Zero should fail
        "risk_factor": 1.5  # > 1.0 should fail
    }

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/opportunities", json=invalid_opp)

    assert response.status_code == 422  # Validation error
