import { describe, expect, it } from 'vitest'
import { barPath, niceMax, parseDay, summarize } from './chartMath'

describe('niceMax', () => {
  it('never goes below 4 so an almost empty chart still has a scale', () => {
    expect([0, 1, 3, 4, NaN].map(niceMax)).toEqual([4, 4, 4, 4, 4])
  })

  it('rounds up to a round, even number (whole middle gridline)', () => {
    const cases = { 5: 6, 7: 8, 9: 10, 11: 12, 13: 16, 17: 20, 21: 30, 35: 40, 45: 50, 65: 80, 85: 100, 250: 300 }
    for (const [max, top] of Object.entries(cases)) expect(niceMax(Number(max))).toBe(top)
    for (const max of [5, 13, 29, 77, 123, 999]) {
      const top = niceMax(max)
      expect(top).toBeGreaterThanOrEqual(max)
      expect(top % 2).toBe(0)
    }
  })
})

describe('summarize', () => {
  it('totals the days and finds the busiest one (first wins a tie)', () => {
    const days = [
      { date: '2026-09-01', count: 0 },
      { date: '2026-09-02', count: 3 },
      { date: '2026-09-03', count: 5 },
      { date: '2026-09-04', count: 5 },
    ]
    expect(summarize(days)).toEqual({ total: 13, peak: { date: '2026-09-03', count: 5, index: 2 } })
  })

  it('has no peak when nothing arrived', () => {
    expect(summarize([{ date: '2026-09-01', count: 0 }])).toEqual({ total: 0, peak: null })
    expect(summarize([])).toEqual({ total: 0, peak: null })
  })
})

describe('parseDay', () => {
  it('reads YYYY-MM-DD as a local date (no UTC shift)', () => {
    const date = parseDay('2026-09-01')
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 8, 1])
    expect(parseDay('2026-09-01T10:00:00Z').getDate()).toBe(1)
  })
})

describe('barPath', () => {
  it('starts at the baseline and rounds only the data end', () => {
    const path = barPath({ x: 10, width: 6, top: 40, base: 100, radius: 2 })
    expect(path.startsWith('M10,100 V42')).toBe(true)
    expect(path.endsWith('V100 Z')).toBe(true)
  })

  it('shrinks the radius for very short columns', () => {
    const path = barPath({ x: 0, width: 6, top: 99, base: 100, radius: 2 })
    expect(path).toContain('V100')
    expect(path).not.toContain('NaN')
  })
})
