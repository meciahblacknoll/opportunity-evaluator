"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
Referenced: plan.json, backend/db/schema.sql
Author: Claude Code

Main FastAPI application for Opportunity Evaluator.
"""

import os
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import aiosqlite
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

# Import API routers
from api import recommendations, opportunities, metrics as metrics_api

# Database configuration
DB_PATH = Path(__file__).parent / "data" / "opportunities.db"
SCHEMA_PATH = Path(__file__).parent / "db" / "schema.sql"
VIEWS_PATH = Path(__file__).parent / "db" / "views.sql"
SEED_PATH = Path(__file__).parent / "db" / "seed_data.sql"


def init_database():
    """Initialize SQLite database with schema, views, and seed data."""
    # Create data directory if it doesn't exist
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Load and execute schema
    with open(SCHEMA_PATH, 'r') as f:
        schema_sql = f.read()
        cursor.executescript(schema_sql)

    # Load and execute views
    with open(VIEWS_PATH, 'r') as f:
        views_sql = f.read()
        cursor.executescript(views_sql)

    # Check if database is empty, if so load seed data
    cursor.execute("SELECT COUNT(*) FROM opportunities")
    count = cursor.fetchone()[0]

    if count == 0:
        with open(SEED_PATH, 'r') as f:
            seed_sql = f.read()
            cursor.executescript(seed_sql)
        print("✓ Loaded seed data")

    conn.commit()
    conn.close()
    print(f"✓ Database initialized at {DB_PATH}")


async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """Dependency to get database connection."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    init_database()
    yield
    # Shutdown (cleanup if needed)
    pass


# Create FastAPI app
app = FastAPI(
    title="Opportunity Evaluator API",
    description="API for evaluating and ranking opportunities using deterministic metrics",
    version="1.1.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(recommendations.router, prefix="/api", tags=["recommendations"])
app.include_router(opportunities.router, prefix="/api", tags=["opportunities"])
app.include_router(metrics_api.router, prefix="/api", tags=["metrics"])


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Opportunity Evaluator API",
        "version": "1.1.0",
        "status": "operational",
        "endpoints": {
            "recommendations": "/api/recommendations",
            "opportunities": "/api/opportunities",
            "metrics": "/api/metrics",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "database": str(DB_PATH.exists())}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
