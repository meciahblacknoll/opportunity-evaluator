/**
 * PROVENANCE
 * Created: 2025-11-14
 * Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
 * Referenced: backend/api/recommendations.py
 * Author: Claude Code
 * Updated: 2025-11-14 (Step 3 - Added scoring mode toggle)
 * Updated: 2025-11-15 (Phase 2.5 - Added CSV/JSON export)
 *
 * Main page component that displays top opportunities ranked by composite score.
 * Supports ROI, ICE, and Combined scoring modes with localStorage persistence.
 */

import React, { useState, useEffect, useMemo } from 'react'
import OpportunityCard from '../components/OpportunityCard'
import ScoringModeToggle from '../components/ScoringModeToggle'
import ExportButtons from '../components/ExportButtons'
import SortControls from '../components/SortControls'
import FilterControls from '../components/FilterControls'
import ControlsBar from '../components/ControlsBar'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'

export default function TopOpportunities() {
  // Initialize mode from localStorage, default to "roi"
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('scoringMode') || 'roi'
  })

  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('score-desc')
  const [filters, setFilters] = useState({
    banks: [],
    types: [],
    minAPR: 0,
    minProfit: 0
  })

  // Persist mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('scoringMode', mode)
  }, [mode])

  const fetchOpportunities = React.useCallback(async () => {
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
  }, [mode])

  // Fetch opportunities whenever mode changes
  useEffect(() => {
    fetchOpportunities()
  }, [fetchOpportunities])

  // Filter opportunities first
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      // Bank filter
      if (filters.banks.length > 0) {
        const oppBank = opp.bank || opp.issuer;
        if (!oppBank || !filters.banks.includes(oppBank)) {
          return false;
        }
      }

      // Type filter
      if (filters.types.length > 0) {
        const oppType = opp.type || opp.category;
        if (!oppType || !filters.types.includes(oppType)) {
          return false;
        }
      }

      // Min APR filter
      if (filters.minAPR > 0) {
        const oppAPR = opp.apr || opp.apr_percent || 0;
        if (oppAPR < filters.minAPR) {
          return false;
        }
      }

      // Min Profit filter
      if (filters.minProfit > 0) {
        const oppProfit = opp.profit || opp.expected_profit || 0;
        if (oppProfit < filters.minProfit) {
          return false;
        }
      }

      return true;
    });
  }, [opportunities, filters]);

  // Sort filtered opportunities
  const sortedOpportunities = useMemo(() => {
    const sorted = [...filteredOpportunities];
    const [field, direction] = sortBy.split('-');

    sorted.sort((a, b) => {
      let aValue, bValue;

      if (field === 'score') {
        aValue = a.composite_score || a.combined_score || 0;
        bValue = b.composite_score || b.combined_score || 0;
      } else if (field === 'apr') {
        aValue = a.apr || a.apr_percent || 0;
        bValue = b.apr || b.apr_percent || 0;
      } else if (field === 'profit') {
        aValue = a.profit || a.expected_profit || 0;
        bValue = b.profit || b.expected_profit || 0;
      }

      if (direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  }, [filteredOpportunities, sortBy]);

  return (
    <div className="app">
      <header>
        <h1>Opportunity Evaluator</h1>
        <p className="subtitle">
          Top opportunities ranked by {mode.toUpperCase()} scoring mode
        </p>
      </header>

      <ControlsBar>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <ScoringModeToggle mode={mode} setMode={setMode} />
          <SortControls sortBy={sortBy} onSortChange={setSortBy} />
        </div>
        <ExportButtons
          data={sortedOpportunities}
          filenameBase="opportunities"
          disabled={loading || opportunities.length === 0}
        />
      </ControlsBar>

      <FilterControls
        filters={filters}
        onFilterChange={setFilters}
        opportunities={opportunities}
      />

      {error && (
        <ErrorState error={error} onRetry={fetchOpportunities} />
      )}

      {loading && !error && (
        <LoadingSkeleton count={6} />
      )}

      {!loading && !error && opportunities.length === 0 && (
        <EmptyState
          message="No opportunities found"
          action="Add some opportunities via the API to get started!"
        />
      )}

      {!loading && !error && opportunities.length > 0 && sortedOpportunities.length === 0 && (
        <EmptyState
          message="No matches found"
          action="No opportunities match the current filters. Try adjusting your filters."
        />
      )}

      {!loading && !error && sortedOpportunities.length > 0 && (
        <div className="opportunities-grid">
          {sortedOpportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} mode={mode} />
          ))}
        </div>
      )}
    </div>
  )
}
