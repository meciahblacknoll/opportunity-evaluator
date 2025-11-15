/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 3 Lite - Empty State Tests
 * Author: Claude Code
 */

import { describe, it, expect } from 'vitest'
import { render } from '../test-utils'
import LoadingSkeleton from '../../components/LoadingSkeleton'

describe('LoadingSkeleton', () => {
  it('renders default number of skeleton cards', () => {
    const { container } = render(<LoadingSkeleton />)
    const skeletonCards = container.querySelectorAll('.skeleton-card')
    expect(skeletonCards).toHaveLength(3) // Default count
  })

  it('renders custom number of skeleton cards', () => {
    const { container } = render(<LoadingSkeleton count={5} />)
    const skeletonCards = container.querySelectorAll('.skeleton-card')
    expect(skeletonCards).toHaveLength(5)
  })

  it('renders grid layout', () => {
    const { container } = render(<LoadingSkeleton />)
    const grid = container.querySelector('.opportunities-grid')
    expect(grid).toBeInTheDocument()
  })

  it('includes pulse animation styles', () => {
    const { container } = render(<LoadingSkeleton />)
    const style = container.querySelector('style')
    expect(style.textContent).toContain('@keyframes pulse')
    expect(style.textContent).toContain('opacity')
  })

  it('renders skeleton elements with correct structure', () => {
    const { container } = render(<LoadingSkeleton count={1} />)
    const skeletonCard = container.querySelector('.skeleton-card')

    // Should have 4 skeleton bars inside
    const bars = skeletonCard.querySelectorAll('div')
    expect(bars.length).toBeGreaterThanOrEqual(4)
  })

  it('handles count of 0', () => {
    const { container } = render(<LoadingSkeleton count={0} />)
    const skeletonCards = container.querySelectorAll('.skeleton-card')
    expect(skeletonCards).toHaveLength(0)
  })

  it('handles large count', () => {
    const { container } = render(<LoadingSkeleton count={12} />)
    const skeletonCards = container.querySelectorAll('.skeleton-card')
    expect(skeletonCards).toHaveLength(12)
  })
})
