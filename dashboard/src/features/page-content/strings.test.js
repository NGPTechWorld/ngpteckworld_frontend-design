import { describe, expect, it } from 'vitest'
import { TAB_LAYOUT } from './layout'
import { VALUE_ICON_KEYS } from './schema'
import strings from './strings'

// The 39 keys of config/site_content.php (docs/PLAN.md §5) — each one needs a "where it appears" hint in both languages.
const TEXT_KEYS = [
  'heroBadge', 'heroT1', 'heroAccent', 'heroSub', 'heroCta1', 'heroCta2', 'intro',
  'servicesKick', 'servicesTitle', 'servicesAll', 'featuredKick', 'featuredTitle', 'processKick', 'processTitle', 'processSub',
  'testimonialsKick', 'testimonialsTitle', 'partnersKick', 'partnersTitle', 'faqKick', 'faqTitle',
  'ctaTitle', 'ctaSub', 'ctaBtn',
  'servicesSub', 'portfolioTitle', 'portfolioSub', 'contactTitle', 'contactSub',
  'aboutTitle', 'aboutStory', 'visionT', 'vision', 'missionT', 'mission', 'valuesT', 'whyT',
  'footTagline', 'footRights',
]

const sorted = (object) => Object.keys(object).sort()

describe('strings', () => {
  it('has the same keys in Arabic and English', () => {
    expect(sorted(strings.ar)).toEqual(sorted(strings.en))
  })

  it('has the same kind of value (text or function) for every key', () => {
    for (const key of Object.keys(strings.en)) expect(typeof strings.ar[key], key).toBe(typeof strings.en[key])
  })

  it('hints where each of the 39 texts appears, in both languages', () => {
    expect(TEXT_KEYS).toHaveLength(39)
    for (const lang of ['ar', 'en']) {
      expect(sorted(strings[lang].keyHints)).toEqual([...TEXT_KEYS].sort())
      for (const key of TEXT_KEYS) expect(strings[lang].keyHints[key].length, `${lang}.${key}`).toBeGreaterThan(10)
    }
  })

  it('describes every collection, tab and icon in both languages', () => {
    for (const lang of ['ar', 'en']) {
      expect(sorted(strings[lang].collections)).toEqual(['process_steps', 'values', 'why_us'])
      for (const collection of Object.values(strings[lang].collections)) {
        for (const key of ['title', 'description', 'add', 'createTitle', 'editTitle', 'emptyTitle', 'emptyHint', 'deleteTitle']) expect(collection[key]).toBeTruthy()
        expect(collection.deleteMessage('X')).toContain('X')
      }
      expect(sorted(strings[lang].tabs)).toEqual(TAB_LAYOUT.map((tab) => tab.key).sort())
      expect(sorted(strings[lang].tabHints)).toEqual(TAB_LAYOUT.map((tab) => tab.key).sort())
      expect(sorted(strings[lang].iconNames)).toEqual([...VALUE_ICON_KEYS].sort())
    }
  })

  it('explains in every collection that the website then shows only the items added here', () => {
    expect(strings.en.collections.values.emptyHint).toMatch(/built-in list of values.*shows only your values/)
    expect(strings.ar.collections.values.emptyHint).toContain('المدمجة')
  })

  it('counts unsaved changes with the right Arabic plural forms', () => {
    const { unsaved } = strings.ar
    expect(unsaved(1)).toBe('تعديل واحد غير محفوظ')
    expect(unsaved(2)).toBe('تعديلان غير محفوظان')
    expect(unsaved(3)).toBe('3 تعديلات غير محفوظة')
    expect(unsaved(10)).toBe('10 تعديلات غير محفوظة')
    expect(unsaved(11)).toBe('11 تعديلًا غير محفوظ')
    expect(unsaved(39)).toBe('39 تعديلًا غير محفوظ')
    expect(strings.en.unsaved(1)).toBe('1 unsaved change')
    expect(strings.en.unsaved(5)).toBe('5 unsaved changes')
  })
})
