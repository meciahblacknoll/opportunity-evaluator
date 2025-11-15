/**
 * PROVENANCE
 * Created: 2025-11-14
 * Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
 * Author: Claude Code
 * Updated: 2025-11-14 (Step 3 - Added mode-specific score display)
 *
 * Component to display a single opportunity with its metrics.
 * Supports ROI, ICE, and Combined scoring modes.
 */

import React from 'react'

function OpportunityCard({ opportunity, mode = 'roi' }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`
  }

  const formatScore = (value) => {
    return value ? value.toFixed(3) : 'N/A'
  }

  // Get mode-specific score display
  const getScoreDisplay = () => {
    if (mode === 'roi') {
      return (
        <>
          <div className="metric">
            <div className="metric-label">Composite ROI</div>
            <div className="metric-value positive">
              {formatScore(opportunity.composite_score)}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">Raw ROI</div>
            <div className="metric-value">
              {formatScore(opportunity.scored_roi)}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">Scored Cost</div>
            <div className="metric-value">
              {formatScore(opportunity.scored_cost)}
            </div>
          </div>
        </>
      )
    }

    if (mode === 'ice') {
      return (
        <>
          <div className="metric">
            <div className="metric-label">ICE Score</div>
            <div className="metric-value positive">
              {formatScore(opportunity.composite_score)}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">Impact</div>
            <div className="metric-value">
              {opportunity.impact || 'N/A'}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">Confidence</div>
            <div className="metric-value">
              {opportunity.confidence || 'N/A'}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">Ease</div>
            <div className="metric-value">
              {opportunity.ease || 'N/A'}
            </div>
          </div>
        </>
      )
    }

    if (mode === 'combined') {
      return (
        <>
          <div className="metric">
            <div className="metric-label">Combined Score</div>
            <div className="metric-value positive">
              {formatScore(opportunity.combined_score)}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">ROI Score</div>
            <div className="metric-value">
              {formatScore(opportunity.scored_roi)}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">ICE Score</div>
            <div className="metric-value">
              {formatScore(opportunity.scored_ice)}
            </div>
          </div>
        </>
      )
    }

    return null
  }

  return (
    <div className="opportunity-card">
      <div className="card-header">
        <div>
          <h3 className="card-title">{opportunity.name}</h3>
          {opportunity.category && (
            <span className="card-category">{opportunity.category}</span>
          )}
        </div>
        <div className="composite-score">
          {formatScore(opportunity.composite_score || opportunity.combined_score)}
          <div className="score-label">Score</div>
        </div>
      </div>

      <div className="metrics-grid">
        {/* Mode-specific scores */}
        {getScoreDisplay()}

        {/* Common metrics */}
        <div className="metric">
          <div className="metric-label">Profit</div>
          <div className={`metric-value ${opportunity.profit > 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(opportunity.profit)}
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">Daily ROI</div>
          <div className="metric-value positive">
            {formatPercent(opportunity.daily_roi_pct)}
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">Opportunity Cost</div>
          <div className="metric-value">
            {formatCurrency(opportunity.opportunity_cost)}
          </div>
        </div>
      </div>

      <div className="badges">
        {opportunity.is_recurring && (
          <span className="badge recurring">Recurring</span>
        )}
        {mode === 'roi' && (
          <>
            <span className="badge">ROI Score: {formatScore(opportunity.scored_roi)}</span>
            <span className="badge">Cost Score: {formatScore(opportunity.scored_cost)}</span>
          </>
        )}
        {mode === 'ice' && opportunity.impact && (
          <span className="badge">I:{opportunity.impact} C:{opportunity.confidence} E:{opportunity.ease}</span>
        )}
        {mode === 'combined' && (
          <span className="badge">ROI+ICE Blend</span>
        )}
      </div>
    </div>
  )
}

export default React.memo(OpportunityCard)
