/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 3 Lite - FilterControls Tests
 * Author: Claude Code
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../test-utils'
import FilterControls from '../../components/FilterControls'

const mockOpportunities = [
  {
    id: 1,
    bank: 'Chase',
    type: 'Credit Card',
    apr: 15.5,
    profit: 500
  },
  {
    id: 2,
    bank: 'AmEx',
    type: 'Credit Card',
    apr: 18.2,
    profit: 750
  },
  {
    id: 3,
    issuer: 'Citi',
    category: 'Loan',
    apr_percent: 12.0,
    expected_profit: 300
  }
]

describe('FilterControls', () => {
  const defaultFilters = {
    banks: [],
    types: [],
    minAPR: 0,
    minProfit: 0
  }

  it('renders filter header and structure', () => {
    const mockOnChange = vi.fn()
    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.queryByText('Reset')).not.toBeInTheDocument() // No reset when no active filters
  })

  it('renders bank checkboxes when banks available', () => {
    const mockOnChange = vi.fn()
    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    expect(screen.getByText('Banks')).toBeInTheDocument()
    expect(screen.getByLabelText('Chase')).toBeInTheDocument()
    expect(screen.getByLabelText('AmEx')).toBeInTheDocument()
    expect(screen.getByLabelText('Citi')).toBeInTheDocument()
  })

  it('renders type checkboxes when types available', () => {
    const mockOnChange = vi.fn()
    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    expect(screen.getByText('Types')).toBeInTheDocument()
    expect(screen.getByLabelText('Credit Card')).toBeInTheDocument()
    expect(screen.getByLabelText('Loan')).toBeInTheDocument()
  })

  it('renders min APR input', () => {
    const mockOnChange = vi.fn()
    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    const aprInput = screen.getByLabelText(/Min APR/i)
    expect(aprInput).toBeInTheDocument()
    expect(aprInput).toHaveAttribute('type', 'number')
    expect(aprInput).toHaveAttribute('step', '0.1')
  })

  it('renders min profit input', () => {
    const mockOnChange = vi.fn()
    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    const profitInput = screen.getByLabelText(/Min Profit/i)
    expect(profitInput).toBeInTheDocument()
    expect(profitInput).toHaveAttribute('type', 'number')
    expect(profitInput).toHaveAttribute('step', '100')
  })

  it('calls onFilterChange when bank checkbox is toggled', () => {
    const mockOnChange = vi.fn()
    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    const chaseCheckbox = screen.getByLabelText('Chase')
    fireEvent.click(chaseCheckbox)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      banks: ['Chase']
    })
  })

  it('calls onFilterChange when type checkbox is toggled', () => {
    const mockOnChange = vi.fn()
    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    const loanCheckbox = screen.getByLabelText('Loan')
    fireEvent.click(loanCheckbox)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      types: ['Loan']
    })
  })

  it('calls onFilterChange when min APR changes', () => {
    const mockOnChange = vi.fn()
    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    const aprInput = screen.getByLabelText(/Min APR/i)
    fireEvent.change(aprInput, { target: { value: '15' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      minAPR: 15
    })
  })

  it('calls onFilterChange when min profit changes', () => {
    const mockOnChange = vi.fn()
    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    const profitInput = screen.getByLabelText(/Min Profit/i)
    fireEvent.change(profitInput, { target: { value: '500' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultFilters,
      minProfit: 500
    })
  })

  it('unchecks bank when toggled off', () => {
    const mockOnChange = vi.fn()
    const activeFilters = {
      ...defaultFilters,
      banks: ['Chase', 'AmEx']
    }

    render(
      <FilterControls
        filters={activeFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    const chaseCheckbox = screen.getByLabelText('Chase')
    fireEvent.click(chaseCheckbox)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...activeFilters,
      banks: ['AmEx']
    })
  })

  it('shows reset button when filters are active', () => {
    const mockOnChange = vi.fn()
    const activeFilters = {
      banks: ['Chase'],
      types: [],
      minAPR: 0,
      minProfit: 0
    }

    render(
      <FilterControls
        filters={activeFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    expect(screen.getByText('Reset')).toBeInTheDocument()
  })

  it('resets all filters when reset button clicked', () => {
    const mockOnChange = vi.fn()
    const activeFilters = {
      banks: ['Chase', 'AmEx'],
      types: ['Loan'],
      minAPR: 15,
      minProfit: 500
    }

    render(
      <FilterControls
        filters={activeFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    const resetButton = screen.getByText('Reset')
    fireEvent.click(resetButton)

    expect(mockOnChange).toHaveBeenCalledWith({
      banks: [],
      types: [],
      minAPR: 0,
      minProfit: 0
    })
  })

  it('displays selected banks as checked', () => {
    const mockOnChange = vi.fn()
    const activeFilters = {
      ...defaultFilters,
      banks: ['Chase', 'Citi']
    }

    render(
      <FilterControls
        filters={activeFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    expect(screen.getByLabelText('Chase')).toBeChecked()
    expect(screen.getByLabelText('Citi')).toBeChecked()
    expect(screen.getByLabelText('AmEx')).not.toBeChecked()
  })

  it('displays current numeric filter values', () => {
    const mockOnChange = vi.fn()
    const activeFilters = {
      ...defaultFilters,
      minAPR: 12.5,
      minProfit: 600
    }

    render(
      <FilterControls
        filters={activeFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    expect(screen.getByLabelText(/Min APR/i)).toHaveValue(12.5)
    expect(screen.getByLabelText(/Min Profit/i)).toHaveValue(600)
  })

  it('handles empty opportunities array', () => {
    const mockOnChange = vi.fn()
    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={[]}
      />
    )

    expect(screen.queryByText('Banks')).not.toBeInTheDocument()
    expect(screen.queryByText('Types')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Min APR/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Min Profit/i)).toBeInTheDocument()
  })

  it('extracts unique banks correctly (bank and issuer fields)', () => {
    const mockOnChange = vi.fn()
    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    // Should have 3 unique banks: Chase, AmEx, Citi
    expect(screen.getByLabelText('Chase')).toBeInTheDocument()
    expect(screen.getByLabelText('AmEx')).toBeInTheDocument()
    expect(screen.getByLabelText('Citi')).toBeInTheDocument()
  })

  it('extracts unique types correctly (type and category fields)', () => {
    const mockOnChange = vi.fn()
    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={mockOpportunities}
      />
    )

    // Should have 2 unique types: Credit Card, Loan
    expect(screen.getByLabelText('Credit Card')).toBeInTheDocument()
    expect(screen.getByLabelText('Loan')).toBeInTheDocument()
  })

  it('sorts banks alphabetically', () => {
    const mockOnChange = vi.fn()
    const unsortedOpps = [
      { id: 1, bank: 'Zebra Bank', type: 'Credit Card', apr: 10, profit: 100 },
      { id: 2, bank: 'Alpha Bank', type: 'Credit Card', apr: 10, profit: 100 },
      { id: 3, bank: 'Middle Bank', type: 'Credit Card', apr: 10, profit: 100 }
    ]

    render(
      <FilterControls
        filters={defaultFilters}
        onFilterChange={mockOnChange}
        opportunities={unsortedOpps}
      />
    )

    const bankLabels = screen.getAllByRole('checkbox', { name: /Bank/i })
      .map(checkbox => checkbox.closest('label').textContent.trim())

    expect(bankLabels).toEqual(['Alpha Bank', 'Middle Bank', 'Zebra Bank'])
  })
})
