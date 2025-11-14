/**
 * PROVENANCE
 * Created: 2025-11-14
 * Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
 * Author: Claude Code
 *
 * Component to display a single opportunity with its metrics.
 */

import React from 'react'

export default function OpportunityCard({ opportunity }) {
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
    return value.toFixed(3)
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
          {formatScore(opportunity.composite_score)}
          <div className="score-label">Score</div>
        </div>
      </div>

      <div className="metrics-grid">
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
          <div className="metric-label">Risk-Adj ROI</div>
          <div className="metric-value positive">
            {formatPercent(opportunity.risk_adjusted_roi)}
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">Opportunity Cost</div>
          <div className="metric-value">
            {formatCurrency(opportunity.opportunity_cost)}
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">Certainty</div>
          <div className="metric-value">
            {formatPercent(opportunity.certainty_score * 100)}
          </div>
        </div>

        {opportunity.liquidation_risk !== null && (
          <div className="metric">
            <div className="metric-label">Liquidation Risk</div>
            <div className="metric-value">
              {formatPercent(opportunity.liquidation_risk * 100)}
            </div>
          </div>
        )}
      </div>

      <div className="badges">
        {opportunity.is_recurring && (
          <span className="badge recurring">Recurring</span>
        )}
        <span className="badge">ROI Score: {formatScore(opportunity.scored_roi)}</span>
        <span className="badge">Cost Score: {formatScore(opportunity.scored_cost)}</span>
      </div>
    </div>
  )
}
