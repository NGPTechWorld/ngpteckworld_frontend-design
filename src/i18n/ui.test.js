import { describe, expect, it } from 'vitest'
import { ui } from './ui'
import { LANGUAGES, DEFAULT_LANG, contentLangOf, isLang, ownsContent } from './languages'

/**
 * A missing key does not throw. It renders as nothing — a heading that is simply absent from the
 * page, in a language nobody on the team reads. With ten dictionaries kept in step by hand that
 * is the failure waiting to happen, so it is the one this file exists to catch.
 */

const CODES = LANGUAGES.map((l) => l.code)
const reference = ui[DEFAULT_LANG]

describe('the dictionaries agree with each other', () => {
  it('ships one for every declared language, and nothing more', () => {
    expect(Object.keys(ui).sort()).toEqual([...CODES].sort())
  })

  it.each(CODES)('%s has exactly the reference keys', (code) => {
    expect(Object.keys(ui[code]).sort()).toEqual(Object.keys(reference).sort())
  })

  it.each(CODES)('%s matches the reference shape — type, and length for lists', (code) => {
    for (const [key, expected] of Object.entries(reference)) {
      const actual = ui[code][key]
      expect(typeof actual, `${code}.${key} is the wrong type`).toBe(typeof expected)
      if (Array.isArray(expected)) {
        expect(actual, `${code}.${key} is not an array`).toBeInstanceOf(Array)
        expect(actual.length, `${code}.${key} has ${actual.length} items, expected ${expected.length}`)
          .toBe(expected.length)
      }
    }
  })

  it.each(CODES)('%s leaves no string blank', (code) => {
    const blank = Object.entries(ui[code])
      .filter(([, v]) => typeof v === 'string' && v.trim() === '')
      .map(([k]) => k)
    expect(blank).toEqual([])
  })

  it.each(CODES)('%s interpolates its function entries', (code) => {
    expect(ui[code].mYears(7)).toContain('7')
    expect(ui[code].cooldownWait(30)).toContain('30')
    expect(ui[code].mOpenLink('GitHub')).toContain('GitHub')
  })
})

describe('the language registry', () => {
  it('speaks Arabic by default and is the only right-to-left one', () => {
    expect(DEFAULT_LANG).toBe('ar')
    expect(LANGUAGES.filter((l) => l.dir === 'rtl').map((l) => l.code)).toEqual(['ar'])
  })

  it('points every European locale at the English database columns', () => {
    // The database has `_ar` and `_en` and nothing else. Any language mapped to a third value
    // would render every service, project and profile on the site blank.
    for (const { code } of LANGUAGES) {
      expect(['ar', 'en']).toContain(contentLangOf(code))
    }
    expect(contentLangOf('de')).toBe('en')
    expect(contentLangOf('ru')).toBe('en')
    expect(contentLangOf('ar')).toBe('ar')
  })

  it('counts only Arabic and English as owning their content', () => {
    expect(CODES.filter(ownsContent)).toEqual(['ar', 'en'])
  })

  it('falls back to the default for an unknown code', () => {
    expect(isLang('zz')).toBe(false)
    expect(contentLangOf('zz')).toBe('ar')
  })
})
