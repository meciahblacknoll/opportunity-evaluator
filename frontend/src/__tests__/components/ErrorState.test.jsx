/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 3 Lite - Empty State Tests
 * Author: Claude Code
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../test-utils'
import ErrorState from '../../components/ErrorState'

describe('ErrorState', () => {
  it('renders default error heading', () => {
    render(<ErrorState />)
    expect(screen.getByText('Error Loading Opportunities')).toBeInTheDocument()
  })

  it('renders default error message', () => {
    render(<ErrorState />)
    expect(screen.getByText(/An unexpected error occurred while fetching data/i)).toBeInTheDocument()
  })

  it('renders custom error message', () => {
    render(<ErrorState error="Custom error message" />)
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
  })

  it('does not render retry button when onRetry not provided', () => {
    render(<ErrorState />)
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
  })

  it('renders retry button when onRetry provided', () => {
    const mockRetry = vi.fn()
    render(<ErrorState onRetry={mockRetry} />)
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('calls onRetry when retry button clicked', () => {
    const mockRetry = vi.fn()
    render(<ErrorState onRetry={mockRetry} />)

    const retryButton = screen.getByText('Try Again')
    fireEvent.click(retryButton)

    expect(mockRetry).toHaveBeenCalledTimes(1)
  })

  it('renders SVG error icon', () => {
    const { container } = render(<ErrorState />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '64')
    expect(svg).toHaveAttribute('height', '64')
  })

  it('applies correct styling', () => {
    const { container } = render(<ErrorState />)
    const wrapper = container.firstChild
    const styles = window.getComputedStyle(wrapper)

    expect(styles.display).toBe('flex')
    expect(styles.flexDirection).toBe('column')
    expect(styles.alignItems).toBe('center')
  })

  it('renders heading with correct styling', () => {
    render(<ErrorState />)
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('Error Loading Opportunities')
  })

  it('handles retry button hover states', () => {
    const mockRetry = vi.fn()
    render(<ErrorState onRetry={mockRetry} />)

    const retryButton = screen.getByText('Try Again')

    // Hover
    fireEvent.mouseEnter(retryButton)
    expect(retryButton.style.opacity).toBe('0.9')

    // Leave
    fireEvent.mouseLeave(retryButton)
    expect(retryButton.style.opacity).toBe('1')
  })

  it('renders both custom error and retry button', () => {
    const mockRetry = vi.fn()
    render(<ErrorState error="Network timeout" onRetry={mockRetry} />)

    expect(screen.getByText('Network timeout')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })
})
