"""
PROVENANCE
Created: 2025-11-14
Prompt: PROMPTS/PLANNING_PROMPT_v2.md
Referenced: ChatGPT feature flag recommendation
Author: Claude Code

Configuration settings for Opportunity Evaluator.
"""

import os

# Phase 2 Feature Flag
# Set to True to enable Phase 2 features (ICE scoring, APR simulation, accounts)
# Default: False for production safety
USE_PHASE2 = os.getenv("USE_PHASE2", "false").lower() == "true"

# Database
DATABASE_PATH = os.getenv("DATABASE_PATH", "./backend/data/opportunities.db")

# API
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

# APR Calculations
# Use 365-day year for APR calculations (vs 360 for some financial products)
APR_DAYS_PER_YEAR = 365

# Simulation Defaults
DEFAULT_SIMULATION_DAYS = 90
MAX_SIMULATION_DAYS = 365
