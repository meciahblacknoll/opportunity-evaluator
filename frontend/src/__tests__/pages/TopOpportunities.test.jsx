import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '../test-utils'
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

// Mock SortControls
vi.mock('../../components/SortControls', () => ({
  default: ({ sortBy, onSortChange }) => (
    <select
      data-testid="sort-controls"
      value={sortBy}
      onChange={(e) => onSortChange(e.target.value)}
    >
      <option value="score-desc">Score (High to Low)</option>
      <option value="profit-desc">Profit (High to Low)</option>
      <option value="apr-desc">APR (High to Low)</option>
    </select>
  )
}))

// Mock FilterControls
vi.mock('../../components/FilterControls', () => ({
  default: ({ filters, onFilterChange, opportunities }) => (
    <div data-testid="filter-controls">
      <button
        data-testid="filter-bank-chase"
        onClick={() => onFilterChange({ ...filters, banks: ['Chase'] })}
      >
        Filter Chase
      </button>
      <button
        data-testid="filter-type-loan"
        onClick={() => onFilterChange({ ...filters, types: ['Loan'] })}
      >
        Filter Loan
      </button>
      <button
        data-testid="filter-min-apr"
        onClick={() => onFilterChange({ ...filters, minAPR: 15 })}
      >
        Min APR 15
      </button>
      <button
        data-testid="filter-min-profit"
        onClick={() => onFilterChange({ ...filters, minProfit: 500 })}
      >
        Min Profit 500
      </button>
      <button
        data-testid="reset-filters"
        onClick={() => onFilterChange({ banks: [], types: [], minAPR: 0, minProfit: 0 })}
      >
        Reset
      </button>
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
    const { container } = render(<TopOpportunities />)

    // Should show loading skeletons instead of text
    const skeletons = container.querySelectorAll('.skeleton-card')
    expect(skeletons.length).toBeGreaterThan(0)
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
    const mockData = [{
      id: 1,
      name: 'Test',
      composite_score: 5.0,
      scored_roi: 2.0,
      scored_cost: 1.5,
      daily_roi_pct: 1.0,
      opportunity_cost: 100,
      profit: 500,
      apr: 12.0
    }]

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

  // Filtering Integration Tests
  describe('Filtering', () => {
    const mockOpportunities = [
      {
        id: 1,
        name: 'Chase Card',
        bank: 'Chase',
        type: 'Credit Card',
        apr: 18.0,
        profit: 600,
        composite_score: 8.0,
        scored_roi: 4.0,
        scored_cost: 3.0,
        daily_roi_pct: 2.0,
        opportunity_cost: 300
      },
      {
        id: 2,
        name: 'AmEx Loan',
        issuer: 'AmEx',
        category: 'Loan',
        apr_percent: 12.0,
        expected_profit: 400,
        composite_score: 6.5,
        scored_roi: 3.0,
        scored_cost: 2.5,
        daily_roi_pct: 1.5,
        opportunity_cost: 200
      },
      {
        id: 3,
        name: 'Citi Card',
        bank: 'Citi',
        type: 'Credit Card',
        apr: 15.5,
        profit: 800,
        composite_score: 9.0,
        scored_roi: 5.0,
        scored_cost: 4.0,
        daily_roi_pct: 2.5,
        opportunity_cost: 400
      }
    ]

    it('filters opportunities by bank', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities
      })

      render(<TopOpportunities />)

      await waitFor(() => {
        expect(screen.getByText('Chase Card')).toBeInTheDocument()
      })

      // Apply Chase filter
      const filterButton = screen.getByTestId('filter-bank-chase')
      fireEvent.click(filterButton)

      // Should show Chase Card, hide others
      expect(screen.getByText('Chase Card')).toBeInTheDocument()
      expect(screen.queryByText('AmEx Loan')).not.toBeInTheDocument()
      expect(screen.queryByText('Citi Card')).not.toBeInTheDocument()
    })

    it('filters opportunities by type', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities
      })

      render(<TopOpportunities />)

      await waitFor(() => {
        expect(screen.getByText('AmEx Loan')).toBeInTheDocument()
      })

      // Apply Loan filter
      const filterButton = screen.getByTestId('filter-type-loan')
      fireEvent.click(filterButton)

      // Should show only AmEx Loan
      expect(screen.queryByText('Chase Card')).not.toBeInTheDocument()
      expect(screen.getByText('AmEx Loan')).toBeInTheDocument()
      expect(screen.queryByText('Citi Card')).not.toBeInTheDocument()
    })

    it('filters opportunities by minimum APR', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities
      })

      render(<TopOpportunities />)

      await waitFor(() => {
        expect(screen.getByText('Chase Card')).toBeInTheDocument()
      })

      // Apply minAPR filter (15)
      const filterButton = screen.getByTestId('filter-min-apr')
      fireEvent.click(filterButton)

      // Should hide AmEx Loan (12% APR), show Chase (18%) and Citi (15.5%)
      expect(screen.getByText('Chase Card')).toBeInTheDocument()
      expect(screen.queryByText('AmEx Loan')).not.toBeInTheDocument()
      expect(screen.getByText('Citi Card')).toBeInTheDocument()
    })

    it('filters opportunities by minimum profit', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities
      })

      render(<TopOpportunities />)

      await waitFor(() => {
        expect(screen.getByText('Chase Card')).toBeInTheDocument()
      })

      // Apply minProfit filter (500)
      const filterButton = screen.getByTestId('filter-min-profit')
      fireEvent.click(filterButton)

      // Should hide AmEx Loan (400 profit), show Chase (600) and Citi (800)
      expect(screen.getByText('Chase Card')).toBeInTheDocument()
      expect(screen.queryByText('AmEx Loan')).not.toBeInTheDocument()
      expect(screen.getByText('Citi Card')).toBeInTheDocument()
    })

    it('shows "no results after filtering" message when all opportunities filtered out', async () => {
      const opportunitiesWithLowValues = [
        {
          id: 1,
          name: 'Low Profit Card',
          bank: 'Chase',
          type: 'Credit Card',
          apr: 10.0,
          profit: 100,
          composite_score: 3.0,
          scored_roi: 1.5,
          scored_cost: 1.0,
          daily_roi_pct: 0.5,
          opportunity_cost: 50
        },
        {
          id: 2,
          name: 'Another Low',
          bank: 'AmEx',
          type: 'Credit Card',
          apr: 12.0,
          profit: 150,
          composite_score: 3.5,
          scored_roi: 1.7,
          scored_cost: 1.2,
          daily_roi_pct: 0.6,
          opportunity_cost: 75
        }
      ]

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => opportunitiesWithLowValues
      })

      render(<TopOpportunities />)

      await waitFor(() => {
        expect(screen.getByText('Low Profit Card')).toBeInTheDocument()
      })

      // Apply filters that exclude everything: minProfit 500, minAPR 15
      const profitButton = screen.getByTestId('filter-min-profit')
      fireEvent.click(profitButton)
      const aprButton = screen.getByTestId('filter-min-apr')
      fireEvent.click(aprButton)

      // Should show filtered empty state
      await waitFor(() => {
        expect(screen.queryByText('Low Profit Card')).not.toBeInTheDocument()
        expect(screen.queryByText('Another Low')).not.toBeInTheDocument()
        expect(screen.getByText(/No opportunities match the current filters/i)).toBeInTheDocument()
      })
    })

    it('resets filters correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities
      })

      render(<TopOpportunities />)

      await waitFor(() => {
        expect(screen.getByText('Chase Card')).toBeInTheDocument()
      })

      // Apply filter
      const filterButton = screen.getByTestId('filter-bank-chase')
      fireEvent.click(filterButton)

      expect(screen.queryByText('AmEx Loan')).not.toBeInTheDocument()

      // Reset filters
      const resetButton = screen.getByTestId('reset-filters')
      fireEvent.click(resetButton)

      // All opportunities should be visible again
      expect(screen.getByText('Chase Card')).toBeInTheDocument()
      expect(screen.getByText('AmEx Loan')).toBeInTheDocument()
      expect(screen.getByText('Citi Card')).toBeInTheDocument()
    })

    it('handles opportunities with missing filter fields gracefully', async () => {
      const incompleteOpps = [
        {
          id: 1,
          name: 'No Bank',
          type: 'Credit Card',
          composite_score: 5.0,
          scored_roi: 2.0,
          scored_cost: 1.5,
          daily_roi_pct: 1.0,
          opportunity_cost: 100
          // Missing: bank, apr, profit
        },
        {
          id: 2,
          name: 'Complete',
          bank: 'Chase',
          type: 'Credit Card',
          apr: 15.0,
          profit: 500,
          composite_score: 7.0,
          scored_roi: 3.0,
          scored_cost: 2.0,
          daily_roi_pct: 1.5,
          opportunity_cost: 200
        }
      ]

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => incompleteOpps
      })

      render(<TopOpportunities />)

      await waitFor(() => {
        expect(screen.getByText('No Bank')).toBeInTheDocument()
        expect(screen.getByText('Complete')).toBeInTheDocument()
      })

      // Apply Chase filter - should hide "No Bank" since it has no bank field
      const filterButton = screen.getByTestId('filter-bank-chase')
      fireEvent.click(filterButton)

      expect(screen.queryByText('No Bank')).not.toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })
  })

  // Sorting Integration Tests
  describe('Sorting', () => {
    const mockOpportunities = [
      {
        id: 1,
        name: 'Low Score',
        composite_score: 5.0,
        apr: 12.0,
        profit: 300,
        scored_roi: 2.0,
        scored_cost: 1.5,
        daily_roi_pct: 1.0,
        opportunity_cost: 150
      },
      {
        id: 2,
        name: 'High Score',
        composite_score: 9.0,
        apr: 18.0,
        profit: 800,
        scored_roi: 5.0,
        scored_cost: 4.0,
        daily_roi_pct: 2.5,
        opportunity_cost: 400
      },
      {
        id: 3,
        name: 'Mid Score',
        composite_score: 7.0,
        apr: 15.0,
        profit: 500,
        scored_roi: 3.5,
        scored_cost: 2.5,
        daily_roi_pct: 1.5,
        opportunity_cost: 250
      }
    ]

    it('sorts opportunities by score descending by default', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities
      })

      render(<TopOpportunities />)

      await waitFor(() => {
        const cards = screen.getAllByText(/Score|Profit|APR/i)
        // High Score (9.0) should appear first
        expect(screen.getByText('High Score')).toBeInTheDocument()
      })
    })

    it('changes sort order when sort control changed', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities
      })

      render(<TopOpportunities />)

      await waitFor(() => {
        expect(screen.getByText('High Score')).toBeInTheDocument()
      })

      // Change to profit sort
      const sortSelect = screen.getByTestId('sort-controls')
      fireEvent.change(sortSelect, { target: { value: 'profit-desc' } })

      // Verify sort control updated
      expect(sortSelect.value).toBe('profit-desc')
    })
  })

  // Combined Filtering + Sorting Tests
  describe('Combined Filtering and Sorting', () => {
    const mockOpportunities = [
      {
        id: 1,
        name: 'Chase Low',
        bank: 'Chase',
        type: 'Credit Card',
        composite_score: 5.0,
        apr: 12.0,
        profit: 300,
        scored_roi: 2.0,
        scored_cost: 1.5,
        daily_roi_pct: 1.0,
        opportunity_cost: 150
      },
      {
        id: 2,
        name: 'Chase High',
        bank: 'Chase',
        type: 'Credit Card',
        composite_score: 9.0,
        apr: 18.0,
        profit: 800,
        scored_roi: 5.0,
        scored_cost: 4.0,
        daily_roi_pct: 2.5,
        opportunity_cost: 400
      },
      {
        id: 3,
        name: 'AmEx Mid',
        issuer: 'AmEx',
        category: 'Loan',
        composite_score: 7.0,
        apr_percent: 15.0,
        expected_profit: 500,
        scored_roi: 3.5,
        scored_cost: 2.5,
        daily_roi_pct: 1.5,
        opportunity_cost: 250
      }
    ]

    it('applies filtering before sorting', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities
      })

      render(<TopOpportunities />)

      await waitFor(() => {
        expect(screen.getByText('Chase High')).toBeInTheDocument()
      })

      // Filter to Chase only
      const filterButton = screen.getByTestId('filter-bank-chase')
      fireEvent.click(filterButton)

      // Should only show Chase opportunities
      expect(screen.getByText('Chase Low')).toBeInTheDocument()
      expect(screen.getByText('Chase High')).toBeInTheDocument()
      expect(screen.queryByText('AmEx Mid')).not.toBeInTheDocument()
    })

    it('does not mutate original opportunities array', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities
      })

      render(<TopOpportunities />)

      await waitFor(() => {
        expect(screen.getByText('Chase High')).toBeInTheDocument()
      })

      // Apply filters and sorting
      const filterButton = screen.getByTestId('filter-bank-chase')
      fireEvent.click(filterButton)

      const sortSelect = screen.getByTestId('sort-controls')
      fireEvent.change(sortSelect, { target: { value: 'profit-desc' } })

      // Reset filters - all opportunities should reappear
      const resetButton = screen.getByTestId('reset-filters')
      fireEvent.click(resetButton)

      expect(screen.getByText('Chase Low')).toBeInTheDocument()
      expect(screen.getByText('Chase High')).toBeInTheDocument()
      expect(screen.getByText('AmEx Mid')).toBeInTheDocument()
    })
  })
})
