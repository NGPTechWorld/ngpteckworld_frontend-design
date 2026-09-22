import { describe, expect, it } from 'vitest'
import { commonStrings } from '@/i18n'
import { ApiError } from '@/lib/api'
import { makeGroups, makeItem } from './fixtures'
import { COLLECTIONS, TAB_LAYOUT, buildTabs, labelOf, tabOfKeys } from './layout'
import {
  MAX_TEXT_LENGTH,
  buildTextsPayload,
  charCount,
  countDirtyItems,
  makeItemSchema,
  makeTextsSchema,
  normalizeText,
  textsServerErrors,
  toItemFormValues,
  toItemPayload,
  toTextsFormValues,
} from './schema'

const c = commonStrings.en

describe('toTextsFormValues', () => {
  it('turns groups into texts.<key>.{ar,en} and null into an empty string', () => {
    const groups = makeGroups()
    groups[0].items[0].value_en = null
    const { texts } = toTextsFormValues(groups)
    expect(texts.heroBadge).toEqual({ ar: 'شركة برمجيات', en: '' })
    expect(texts.footRights).toEqual({ ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' })
    expect(Object.keys(texts)).toHaveLength(8)
  })
})

describe('buildTextsPayload', () => {
  const groups = makeGroups()
  const values = toTextsFormValues(groups)

  it('sends only the dirty keys and only their dirty languages, in the order of the page', () => {
    const edited = { texts: { ...values.texts, aboutTitle: { ar: 'قصتنا', en: 'Story' }, heroBadge: { ar: 'شارة', en: 'Software Studio' } } }
    const dirty = { texts: { aboutTitle: { en: true }, heroBadge: { ar: true } } }
    expect(buildTextsPayload(edited, dirty, groups)).toEqual([
      { key: 'heroBadge', value_ar: 'شارة' },
      { key: 'aboutTitle', value_en: 'Story' },
    ])
  })

  it('sends both languages of a key when both are dirty and nothing when nothing is', () => {
    const edited = { texts: { ...values.texts, ctaTitle: { ar: 'ا', en: 'B' } } }
    expect(buildTextsPayload(edited, { texts: { ctaTitle: { ar: true, en: true } } }, groups)).toEqual([{ key: 'ctaTitle', value_ar: 'ا', value_en: 'B' }])
    expect(buildTextsPayload(values, {}, groups)).toEqual([])
    expect(buildTextsPayload(values, { texts: { ctaTitle: {} } }, groups)).toEqual([])
  })

  it('trims, and sends an emptied value as null (= use the built-in text)', () => {
    const edited = { texts: { ...values.texts, heroBadge: { ar: '   ', en: '  New  ' } } }
    expect(buildTextsPayload(edited, { texts: { heroBadge: { ar: true, en: true } } }, groups)).toEqual([{ key: 'heroBadge', value_ar: null, value_en: 'New' }])
    expect(normalizeText(undefined)).toBeNull()
    expect(normalizeText(' a ')).toBe('a')
  })
})

describe('countDirtyItems', () => {
  it('counts texts, not languages, and ignores entries that went back to clean', () => {
    const dirty = { texts: { heroBadge: { ar: true, en: true }, aboutTitle: { en: true }, ctaTitle: {}, footRights: { ar: false } } }
    expect(countDirtyItems(dirty)).toBe(2)
    expect(countDirtyItems(dirty, ['aboutTitle', 'ctaTitle'])).toBe(1)
    expect(countDirtyItems({})).toBe(0)
    expect(countDirtyItems(undefined)).toBe(0)
  })
})

describe('makeTextsSchema', () => {
  const groups = makeGroups()
  const schema = makeTextsSchema(c, groups)
  const base = toTextsFormValues(groups)

  it('accepts empty values and exactly 2000 characters', () => {
    const ok = { texts: { ...base.texts, heroBadge: { ar: '', en: 'a'.repeat(MAX_TEXT_LENGTH) } } }
    expect(schema.safeParse(ok).success).toBe(true)
  })

  it('counts the value after trimming, like the server does', () => {
    const padded = { texts: { ...base.texts, heroBadge: { ar: `  ${'a'.repeat(MAX_TEXT_LENGTH)}  `, en: '' } } }
    expect(schema.safeParse(padded).success).toBe(true)
  })

  it('rejects more than 2000 characters, on the right path, counting characters like PHP does', () => {
    const tooLong = { texts: { ...base.texts, heroBadge: { ar: 'ع'.repeat(2001), en: '' } } }
    const result = schema.safeParse(tooLong)
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toEqual(['texts', 'heroBadge', 'ar'])
    expect(result.error.issues[0].message).toBe('At most 2000 characters')

    // 2000 emoji are 4000 UTF-16 units but 2000 characters
    expect(charCount('😀'.repeat(2000))).toBe(2000)
    expect(schema.safeParse({ texts: { ...base.texts, heroBadge: { ar: '😀'.repeat(2000), en: '' } } }).success).toBe(true)
  })
})

describe('textsServerErrors', () => {
  const sent = [{ key: 'heroBadge', value_ar: 'x' }, { key: 'aboutTitle', value_en: 'y' }]

  it('maps items.<position>.value_<lang> back to the form field of that key', () => {
    const err = new ApiError({ status: 422, errors: { 'items.1.value_en': ['Too long.'], 'items.0.value_ar': ['Bad.', 'Worse.'] } })
    expect(textsServerErrors(err, sent)).toEqual([
      { key: 'aboutTitle', name: 'texts.aboutTitle.en', message: 'Too long.' },
      { key: 'heroBadge', name: 'texts.heroBadge.ar', message: 'Bad.' },
    ])
  })

  it('leaves out errors that are not about a value or point at nothing we sent', () => {
    const err = new ApiError({ status: 422, errors: { items: ['required'], 'items.0.key': ['unknown'], 'items.9.value_en': ['?'] } })
    expect(textsServerErrors(err, sent)).toEqual([])
  })
})

describe('collection items', () => {
  it('values need a title and one of the four icons and have no body; the others have an optional body and no icon', () => {
    const values = makeItemSchema(c, 'values')
    expect(values.safeParse({ title_ar: 'ا', title_en: 'A', is_active: true, icon_key: 'commit' }).success).toBe(true)
    expect(values.safeParse({ title_ar: 'ا', title_en: 'A', is_active: true, icon_key: 'rocket' }).success).toBe(false)
    expect(values.safeParse({ title_ar: 'ا', title_en: 'A', is_active: true }).success).toBe(false)

    const steps = makeItemSchema(c, 'process_steps')
    expect(steps.safeParse({ title_ar: 'ا', title_en: 'A', is_active: true, body_ar: '', body_en: '' }).success).toBe(true)
    expect(steps.safeParse({ title_ar: '', title_en: 'A', is_active: true, body_ar: '', body_en: '' }).success).toBe(false)
    expect(steps.safeParse({ title_ar: 'ا', title_en: 'A'.repeat(256), is_active: true, body_ar: '', body_en: '' }).success).toBe(false)
    expect(steps.safeParse({ title_ar: 'ا', title_en: 'A', is_active: true, body_ar: 'x'.repeat(2001), body_en: '' }).success).toBe(false)
  })

  it('builds the form values: empty for new (active, first icon), the record for an edit, "quality" for a value without an icon', () => {
    expect(toItemFormValues('why_us', null)).toEqual({ title_ar: '', title_en: '', is_active: true, body_ar: '', body_en: '' })
    expect(toItemFormValues('values', null)).toEqual({ title_ar: '', title_en: '', is_active: true, icon_key: 'quality' })
    expect(toItemFormValues('why_us', makeItem(3, 'why_us', { body_en: null, is_active: false }))).toEqual({
      title_ar: 'عنوان 3',
      title_en: 'Title 3',
      is_active: false,
      body_ar: 'نص 3',
      body_en: '',
    })
    expect(toItemFormValues('values', makeItem(4, 'values', { icon_key: null })).icon_key).toBe('quality')
    expect(toItemFormValues('values', makeItem(4, 'values', { icon_key: 'eye' })).icon_key).toBe('quality')
    expect(toItemFormValues('values', makeItem(4, 'values', { icon_key: 'transparency' })).icon_key).toBe('transparency')
  })

  it('builds the payload: collection only on create, body only outside values, icon only for values', () => {
    const form = { title_ar: 'ا', title_en: 'A', is_active: true, body_ar: '', body_en: 'B' }
    expect(toItemPayload('process_steps', form)).toEqual({ collection: 'process_steps', title_ar: 'ا', title_en: 'A', is_active: true, body_ar: null, body_en: 'B' })
    expect(toItemPayload('process_steps', form, { isEdit: true })).not.toHaveProperty('collection')

    const value = { title_ar: 'ا', title_en: 'A', is_active: false, icon_key: 'eye' }
    expect(toItemPayload('values', value)).toEqual({ collection: 'values', title_ar: 'ا', title_en: 'A', is_active: false, icon_key: 'eye' })
    expect(toItemPayload('values', value)).not.toHaveProperty('body_ar')
  })
})

describe('tab layout', () => {
  it('shows every group and every collection exactly once', () => {
    const groups = ['home_hero', 'home_sections', 'cta', 'pages', 'about', 'footer'].map((group) => ({ group, label: group, items: [] }))
    const tabs = buildTabs(groups)
    expect(tabs.flatMap((tab) => tab.groups.map((group) => group.group)).sort()).toEqual([...groups.map((group) => group.group)].sort())
    expect(tabs.flatMap((tab) => tab.collections).sort()).toEqual([...COLLECTIONS].sort())
    expect(TAB_LAYOUT.map((tab) => tab.key)).toEqual(['home', 'about', 'pages', 'shared'])
  })

  it('puts a group the layout does not know in the last tab instead of dropping it', () => {
    const groups = [{ group: 'home_hero', label: 'A', items: [] }, { group: 'brand_new', label: 'B', items: [] }]
    const tabs = buildTabs(groups)
    expect(tabs.at(-1).groups.map((group) => group.group)).toEqual(['brand_new'])
    expect(tabs[0].groups.map((group) => group.group)).toEqual(['home_hero'])
  })

  it('maps each text key to its tab and picks the label of the language', () => {
    const tabs = buildTabs(makeGroups())
    expect(tabOfKeys(tabs)).toMatchObject({ heroBadge: 'home', servicesKick: 'home', aboutTitle: 'about', contactTitle: 'pages', ctaTitle: 'shared', footRights: 'shared' })
    expect(labelOf({ label: 'English', label_ar: 'عربي' }, 'ar')).toBe('عربي')
    expect(labelOf({ label: 'English', label_ar: 'عربي' }, 'en')).toBe('English')
    expect(labelOf({ label: 'English', label_ar: null }, 'ar')).toBe('English')
  })
})
