/**
 * PROVENANCE
 * Created: 2025-11-14
 * Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
 * Referenced: backend/api/recommendations.py
 * Author: Claude Code
 *
 * Main page component that displays top opportunities ranked by composite score.
 */

import React, { useState, useEffect } from 'react'
import OpportunityCard from '../components/OpportunityCard'

export default function TopOpportunities() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/recommendations?limit=10')

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
          Top opportunities ranked by composite score (ROI, Cost, Certainty)
        </p>
      </header>

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
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      )}
    </div>
  )
}
