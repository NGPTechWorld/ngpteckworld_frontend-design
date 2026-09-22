import { describe, expect, it } from 'vitest'
import { formatBytes, formatDate, formatDateTime, formatNumber, formatRelative } from './format'

describe('format', () => {
  it('formats numbers with latin digits in both languages', () => {
    expect(formatNumber(1234567, 'en')).toBe('1,234,567')
    expect(formatNumber(1234, 'ar')).toMatch(/^1[,٬]234$/)
    expect(formatNumber(null)).toBe('—')
    expect(formatNumber('abc')).toBe('—')
  })

  it('formats dates and falls back for invalid values', () => {
    expect(formatDate('2026-09-21T10:00:00Z', 'en')).toMatch(/21 Sep(t)? 2026/)
    expect(formatDate('2026-09-21T10:00:00Z', 'ar')).toMatch(/2026/)
    expect(formatDate('nonsense', 'en')).toBe('—')
    expect(formatDate(null, 'en')).toBe('—')
    expect(formatDateTime('2026-09-21T10:00:00Z', 'en')).toMatch(/2026/)
  })

  it('formats relative times', () => {
    const now = Date.parse('2026-09-21T12:00:00Z')
    expect(formatRelative('2026-09-21T11:55:00Z', 'en', now)).toMatch(/5 minutes ago/)
    expect(formatRelative('2026-09-19T12:00:00Z', 'en', now)).toMatch(/2 days ago/)
    expect(formatRelative('2025-01-01T00:00:00Z', 'en', now)).toMatch(/2025/)
  })

  it('formats bytes', () => {
    expect(formatBytes(512, 'en')).toBe('512 B')
    expect(formatBytes(2048, 'en')).toBe('2 KB')
    expect(formatBytes(5 * 1024 * 1024, 'en')).toBe('5 MB')
  })
})
