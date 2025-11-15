import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test-utils'
import TopOpportunities from '../../pages/TopOpportunities'

// Mock ExportButtons component
vi.mock('../../components/ExportButtons', () => ({
  default: ({ data, filenameBase, disabled }) => (
    <div data-testid="export-buttons" data-filename={filenameBase} data-disabled={disabled}>
      Export Buttons
    </div>
  )
}))

// Mock ScoringModeToggle
vi.mock('../../components/ScoringModeToggle', () => ({
  default: ({ mode, setMode }) => (
    <div data-testid="scoring-toggle" onClick={() => setMode('ice')}>
      Mode: {mode}
    </div>
  )
}))

// Mock fetch
global.fetch = vi.fn()

describe('TopOpportunities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    render(<TopOpportunities />)
    expect(screen.getByText(/Loading opportunities/i)).toBeInTheDocument()
  })

  it('renders opportunity cards when data loads', async () => {
    const mockData = [
      {
        id: 1,
        name: 'Opportunity 1',
        composite_score: 5.5,
        scored_roi: 4.0,
        scored_cost: 3.0,
        profit: 1000,
        daily_roi_pct: 2.0,
        opportunity_cost: 500
      }
    ]

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    })

    render(<TopOpportunities />)

    await waitFor(() => {
      expect(screen.getByText('Opportunity 1')).toBeInTheDocument()
    })
  })

  it('renders ExportButtons with correct props', async () => {
    const mockData = [{ id: 1, name: 'Test' }]

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    })

    render(<TopOpportunities />)

    await waitFor(() => {
      const exportButtons = screen.getByTestId('export-buttons')
      expect(exportButtons).toBeInTheDocument()
      expect(exportButtons.getAttribute('data-filename')).toBe('opportunities')
    })
  })

  it('disables export when no opportunities', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    render(<TopOpportunities />)

    await waitFor(() => {
      const exportButtons = screen.getByTestId('export-buttons')
      expect(exportButtons.getAttribute('data-disabled')).toBe('true')
    })
  })
})
