import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test-utils'
import SimulatePage from '../../pages/SimulatePage'

// Mock ChartWrapper to avoid Recharts
vi.mock('../../components/ChartWrapper', () => ({
  default: ({ data, height }) => (
    <div data-testid="chart-wrapper" data-points={data?.length}>
      Chart Mock
    </div>
  )
}))

// Mock ExportButtons
vi.mock('../../components/ExportButtons', () => ({
  default: ({ data, filenameBase }) => (
    <div data-testid="export-buttons" data-filename={filenameBase}>
      Export Buttons
    </div>
  )
}))

// Mock fetch
global.fetch = vi.fn(() => Promise.resolve({
  ok: true,
  json: async () => ([])
}))

describe('SimulatePage', () => {
  it('renders simulation form', async () => {
    render(<SimulatePage />)
    expect(screen.getByText(/Simulation Inputs/i)).toBeInTheDocument()
    expect(screen.getByText(/Start Date/i)).toBeInTheDocument()
    expect(screen.getByText(/End Date/i)).toBeInTheDocument()
  })

  it('renders run simulation button', () => {
    render(<SimulatePage />)
    expect(screen.getByText(/Run Simulation/i)).toBeInTheDocument()
  })

  it('does not show results initially', () => {
    render(<SimulatePage />)
    expect(screen.queryByText(/Simulation Results/i)).not.toBeInTheDocument()
  })
})
