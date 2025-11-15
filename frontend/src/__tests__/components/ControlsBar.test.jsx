/**
 * PROVENANCE
 * Created: 2025-11-15
 * Phase: 3 Lite - ControlsBar Tests
 * Author: Claude Code
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import ControlsBar from '../../components/ControlsBar'

describe('ControlsBar', () => {
  it('renders children correctly', () => {
    render(
      <ControlsBar>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </ControlsBar>
    )

    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ControlsBar className="custom-class">
        <div>Content</div>
      </ControlsBar>
    )

    const bar = container.querySelector('.controls-bar')
    expect(bar).toHaveClass('custom-class')
  })

  it('has default className when none provided', () => {
    const { container } = render(
      <ControlsBar>
        <div>Content</div>
      </ControlsBar>
    )

    const bar = container.querySelector('.controls-bar')
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveClass('controls-bar')
  })

  it('renders with correct layout styles', () => {
    const { container } = render(
      <ControlsBar>
        <div>Content</div>
      </ControlsBar>
    )

    const bar = container.querySelector('.controls-bar')
    const styles = window.getComputedStyle(bar)

    expect(styles.display).toBe('flex')
    expect(styles.justifyContent).toBe('space-between')
    expect(styles.alignItems).toBe('center')
    expect(styles.flexWrap).toBe('wrap')
  })

  it('renders multiple children in correct order', () => {
    render(
      <ControlsBar>
        <span>First</span>
        <span>Second</span>
        <span>Third</span>
      </ControlsBar>
    )

    const elements = screen.getAllByText(/First|Second|Third/)
    expect(elements).toHaveLength(3)
    expect(elements[0]).toHaveTextContent('First')
    expect(elements[1]).toHaveTextContent('Second')
    expect(elements[2]).toHaveTextContent('Third')
  })

  it('renders without children', () => {
    const { container } = render(<ControlsBar />)

    const bar = container.querySelector('.controls-bar')
    expect(bar).toBeInTheDocument()
    expect(bar).toBeEmptyDOMElement()
  })

  it('handles single child', () => {
    render(
      <ControlsBar>
        <button>Single Child</button>
      </ControlsBar>
    )

    expect(screen.getByRole('button', { name: 'Single Child' })).toBeInTheDocument()
  })
})
