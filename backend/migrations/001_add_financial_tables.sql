-- PROVENANCE
-- Created: 2025-11-14
-- Prompt: PROMPTS/PLANNING_PROMPT_v2.md
-- Author: Claude Code
-- Migration: 001 - Add financial modeling tables (Phase 2)

-- This migration is idempotent (can be run multiple times safely)
-- All CREATE statements use IF NOT EXISTS

-- Load schema v2
-- This file should be run against an existing Phase 1 database

-- Include all Phase 2 tables (same as schema_v2.sql but as migration)
.read backend/db/schema_v2.sql
