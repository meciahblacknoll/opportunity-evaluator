import { describe, it, expect } from 'vitest'
import { centsToDollars } from '../../utils/centsToDollars'

describe('centsToDollars', () => {
  it('converts cents to dollars correctly', () => {
    expect(centsToDollars(100)).toBe('1.00')
    expect(centsToDollars(1234)).toBe('12.34')
    expect(centsToDollars(50)).toBe('0.50')
  })

  it('handles null and undefined as $0.00', () => {
    expect(centsToDollars(null)).toBe('0.00')
    expect(centsToDollars(undefined)).toBe('0.00')
  })

  it('handles negative values', () => {
    expect(centsToDollars(-500)).toBe('-5.00')
  })

  it('rounds to nearest cent', () => {
    expect(centsToDollars(123)).toBe('1.23')
  })

  it('handles zero', () => {
    expect(centsToDollars(0)).toBe('0.00')
  })

  it('handles NaN', () => {
    expect(centsToDollars(NaN)).toBe('0.00')
  })
})
