/**
 * PROVENANCE
 * Created: 2025-11-14
 * Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
 * Referenced: backend/api/recommendations.py
 * Author: Claude Code
 * Updated: 2025-11-14 (Step 3 - Added scoring mode toggle)
 *
 * Main page component that displays top opportunities ranked by composite score.
 * Supports ROI, ICE, and Combined scoring modes with localStorage persistence.
 */

import React, { useState, useEffect } from 'react'
import OpportunityCard from '../components/OpportunityCard'
import ScoringModeToggle from '../components/ScoringModeToggle'

export default function TopOpportunities() {
  // Initialize mode from localStorage, default to "roi"
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('scoringMode') || 'roi'
  })

  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Persist mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('scoringMode', mode)
  }, [mode])

  // Fetch opportunities whenever mode changes
  useEffect(() => {
    fetchOpportunities()
  }, [mode])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/recommendations?mode=${mode}&limit=25`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setOpportunities(data)
    } catch (err) {
      setError(`Failed to load opportunities: ${err.message}`)
      console.error('Error fetching opportunities:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Opportunity Evaluator</h1>
        <p className="subtitle">
          Top opportunities ranked by {mode.toUpperCase()} scoring mode
        </p>
      </header>

      <ScoringModeToggle mode={mode} setMode={setMode} />

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          Loading opportunities...
        </div>
      )}

      {!loading && !error && opportunities.length === 0 && (
        <div className="loading">
          No opportunities found. Add some via the API!
        </div>
      )}

      {!loading && !error && opportunities.length > 0 && (
        <div className="opportunities-grid">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} mode={mode} />
          ))}
        </div>
      )}
    </div>
  )
}
