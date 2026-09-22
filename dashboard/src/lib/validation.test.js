import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import common from '@/i18n/common'
import { emptyToNull, intField, optionalText, optionalUrl, requiredEmail, requiredText, requiredUrl } from './validation'

const c = common.en
const messages = (schema, value) => {
  const result = schema.safeParse(value)
  return result.success ? null : result.error.issues.map((issue) => issue.message)
}

describe('validation helpers', () => {
  it('requiredText trims, requires and caps the length', () => {
    const schema = requiredText(c, 5)
    expect(schema.parse('  ab ')).toBe('ab')
    expect(messages(schema, '   ')).toEqual(['This field is required'])
    expect(messages(schema, 'abcdef')).toEqual(['At most 5 characters'])
  })

  it('optionalText accepts an empty string', () => {
    expect(optionalText(c, 3).parse('')).toBe('')
    expect(messages(optionalText(c, 3), 'abcd')).toEqual(['At most 3 characters'])
  })

  it('URLs must be http(s); optionalUrl also accepts ""', () => {
    expect(optionalUrl(c).parse('')).toBe('')
    expect(optionalUrl(c).parse(' https://ngptechworld.com/x ')).toBe('https://ngptechworld.com/x')
    expect(messages(optionalUrl(c), 'ftp://x.com')).toEqual([c.invalidUrl])
    expect(messages(optionalUrl(c), 'not a url')).toEqual([c.invalidUrl])
    expect(requiredUrl(c).parse('http://a.co')).toBe('http://a.co')
    expect(messages(requiredUrl(c), '')).toEqual(['This field is required', c.invalidUrl])
  })

  it('requiredEmail', () => {
    expect(requiredEmail(c).parse('a@ngptechworld.com')).toBe('a@ngptechworld.com')
    expect(messages(requiredEmail(c), 'nope')).toEqual([c.invalidEmail])
  })

  it('intField coerces strings and reports localized errors', () => {
    const schema = intField(c, { min: 1990, max: 2100 })
    expect(schema.parse('2024')).toBe(2024)
    expect(messages(schema, 'abc')).toEqual([c.invalidNumber])
    expect(messages(schema, '1800')).toEqual(['Must be between 1990 and 2100'])
    expect(messages(schema, '2200')).toEqual(['Must be between 1990 and 2100'])
    expect(messages(schema, '2020.5')).toEqual([c.invalidNumber])
    expect(z.object({ rating: intField(common.ar, { min: 1, max: 5 }) }).safeParse({ rating: '9' }).error.issues[0].message).toMatch(/بين 1 و5/)
  })

  it('emptyToNull', () => {
    expect(emptyToNull('')).toBeNull()
    expect(emptyToNull(undefined)).toBeNull()
    expect(emptyToNull('x')).toBe('x')
    expect(emptyToNull(0)).toBe(0)
  })
})
