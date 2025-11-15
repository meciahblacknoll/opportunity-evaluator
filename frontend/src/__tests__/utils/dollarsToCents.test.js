import { describe, it, expect } from 'vitest'
import { dollarsToCents } from '../../utils/dollarsToCents'

describe('dollarsToCents', () => {
  it('converts dollars to cents correctly', () => {
    expect(dollarsToCents(1)).toBe(100)
    expect(dollarsToCents(12.34)).toBe(1234)
    expect(dollarsToCents("10.50")).toBe(1050)
  })

  it('handles empty string and null as 0', () => {
    expect(dollarsToCents("")).toBe(0)
    expect(dollarsToCents(null)).toBe(0)
    expect(dollarsToCents(undefined)).toBe(0)
  })

  it('handles negative values', () => {
    expect(dollarsToCents(-5.00)).toBe(-500)
  })

  it('strips currency symbols', () => {
    expect(dollarsToCents("$10.00")).toBe(1000)
  })

  it('rounds to nearest cent', () => {
    expect(dollarsToCents(10.999)).toBe(1100)
  })
})
