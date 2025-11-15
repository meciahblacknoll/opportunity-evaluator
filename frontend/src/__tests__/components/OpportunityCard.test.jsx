import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import OpportunityCard from '../../components/OpportunityCard'

describe('OpportunityCard', () => {
  const mockOpportunity = {
    id: 1,
    name: 'Test Opportunity',
    composite_score: 5.678,
    scored_roi: 4.5,
    scored_cost: 3.2,
    profit: 10000,
    daily_roi_pct: 2.5,
    opportunity_cost: 5000,
    is_recurring: true,
    combined_score: 5.678
  }

  it('renders opportunity title', () => {
    render(<OpportunityCard opportunity={mockOpportunity} mode="roi" />)
    expect(screen.getByText('Test Opportunity')).toBeInTheDocument()
  })

  it('renders composite score', () => {
    render(<OpportunityCard opportunity={mockOpportunity} mode="roi" />)
    const scores = screen.getAllByText('5.678')
    expect(scores.length).toBeGreaterThan(0)
  })

  it('renders ROI metrics in ROI mode', () => {
    render(<OpportunityCard opportunity={mockOpportunity} mode="roi" />)
    expect(screen.getByText(/Composite ROI/i)).toBeInTheDocument()
    expect(screen.getByText(/Raw ROI/i)).toBeInTheDocument()
  })

  it('renders recurring badge when is_recurring is true', () => {
    render(<OpportunityCard opportunity={mockOpportunity} mode="roi" />)
    expect(screen.getByText('Recurring')).toBeInTheDocument()
  })

  it('formats currency values', () => {
    render(<OpportunityCard opportunity={mockOpportunity} mode="roi" />)
    expect(screen.getByText(/\$10,000/)).toBeInTheDocument()
  })
})
