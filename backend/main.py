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
from config import USE_PHASE2

# Phase 2 imports (conditional)
if USE_PHASE2:
    from api import accounts, simulate

# Database configuration
DB_PATH = Path(__file__).parent / "data" / "opportunities.db"
SCHEMA_PATH = Path(__file__).parent / "db" / "schema.sql"
VIEWS_PATH = Path(__file__).parent / "db" / "views.sql"
SEED_PATH = Path(__file__).parent / "db" / "seed_data.sql"

# Phase 2 database paths
SCHEMA_V2_PATH = Path(__file__).parent / "db" / "schema_v2.sql"
VIEWS_V2_PATH = Path(__file__).parent / "db" / "views_v2.sql"
SEED_V2_PATH = Path(__file__).parent / "db" / "seed_phase2.sql"


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

    # Phase 2: Load additional schema and views
    if USE_PHASE2:
        if SCHEMA_V2_PATH.exists():
            with open(SCHEMA_V2_PATH, 'r') as f:
                schema_v2_sql = f.read()
                cursor.executescript(schema_v2_sql)
            print("✓ Loaded Phase 2 schema")

        if VIEWS_V2_PATH.exists():
            with open(VIEWS_V2_PATH, 'r') as f:
                views_v2_sql = f.read()
                cursor.executescript(views_v2_sql)
            print("✓ Loaded Phase 2 views")

    # Check if database is empty, if so load seed data
    cursor.execute("SELECT COUNT(*) FROM opportunities")
    count = cursor.fetchone()[0]

    if count == 0:
        with open(SEED_PATH, 'r') as f:
            seed_sql = f.read()
            cursor.executescript(seed_sql)
        print("✓ Loaded seed data")

        # Phase 2: Load additional seed data
        if USE_PHASE2 and SEED_V2_PATH.exists():
            with open(SEED_V2_PATH, 'r') as f:
                seed_v2_sql = f.read()
                cursor.executescript(seed_v2_sql)
            print("✓ Loaded Phase 2 seed data")

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

# Phase 2 routers
if USE_PHASE2:
    app.include_router(accounts.router, prefix="/api", tags=["accounts"])
    app.include_router(simulate.router, prefix="/api", tags=["simulation"])


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
