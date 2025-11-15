import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../test-utils'
import SortControls from '../../components/SortControls'

describe('SortControls', () => {
  it('renders sort dropdown', () => {
    const mockOnChange = vi.fn()
    render(<SortControls sortBy="score-desc" onSortChange={mockOnChange} />)

    expect(screen.getByLabelText(/Sort opportunities/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(/Score \(High to Low\)/i)).toBeInTheDocument()
  })

  it('calls onSortChange when selection changes', () => {
    const mockOnChange = vi.fn()
    render(<SortControls sortBy="score-desc" onSortChange={mockOnChange} />)

    const select = screen.getByLabelText(/Sort opportunities/i)
    fireEvent.change(select, { target: { value: 'profit-desc' } })

    expect(mockOnChange).toHaveBeenCalledWith('profit-desc')
  })

  it('renders all sort options', () => {
    const mockOnChange = vi.fn()
    render(<SortControls sortBy="score-desc" onSortChange={mockOnChange} />)

    expect(screen.getByText(/Score \(High to Low\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Score \(Low to High\)/i)).toBeInTheDocument()
    expect(screen.getByText(/APR \(High to Low\)/i)).toBeInTheDocument()
    expect(screen.getByText(/APR \(Low to High\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Profit \(High to Low\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Profit \(Low to High\)/i)).toBeInTheDocument()
  })

  it('displays selected value correctly', () => {
    const mockOnChange = vi.fn()
    render(<SortControls sortBy="apr-asc" onSortChange={mockOnChange} />)

    const select = screen.getByLabelText(/Sort opportunities/i)
    expect(select.value).toBe('apr-asc')
  })
})
