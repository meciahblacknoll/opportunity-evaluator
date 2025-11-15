/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 3 Lite - Empty State Tests
 * Author: Claude Code
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import EmptyState from '../../components/EmptyState'

describe('EmptyState', () => {
  it('renders default message', () => {
    render(<EmptyState />)
    expect(screen.getByText('No opportunities found')).toBeInTheDocument()
  })

  it('renders custom message', () => {
    render(<EmptyState message="Custom empty message" />)
    expect(screen.getByText('Custom empty message')).toBeInTheDocument()
  })

  it('renders default action text', () => {
    render(<EmptyState />)
    expect(screen.getByText(/Add some opportunities via the API to get started!/i)).toBeInTheDocument()
  })

  it('renders custom action text', () => {
    render(<EmptyState action="Try something different!" />)
    expect(screen.getByText('Try something different!')).toBeInTheDocument()
  })

  it('renders with custom message and action', () => {
    render(
      <EmptyState
        message="No results"
        action="Clear your filters"
      />
    )
    expect(screen.getByText('No results')).toBeInTheDocument()
    expect(screen.getByText('Clear your filters')).toBeInTheDocument()
  })

  it('renders SVG icon', () => {
    const { container } = render(<EmptyState />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '64')
    expect(svg).toHaveAttribute('height', '64')
  })

  it('applies correct styling', () => {
    const { container } = render(<EmptyState />)
    const wrapper = container.firstChild
    const styles = window.getComputedStyle(wrapper)

    expect(styles.display).toBe('flex')
    expect(styles.flexDirection).toBe('column')
    expect(styles.alignItems).toBe('center')
  })

  it('renders heading with message', () => {
    render(<EmptyState message="Test Message" />)
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('Test Message')
  })

  it('renders action as element when provided', () => {
    const actionElement = <a href="/add">Add new opportunity</a>
    render(<EmptyState action={actionElement} />)
    expect(screen.getByText('Add new opportunity')).toBeInTheDocument()
  })
})
