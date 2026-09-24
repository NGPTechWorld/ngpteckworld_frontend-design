import { describe, expect, it } from 'vitest'
import common from '@/i18n/common'
import { CV_SECTION_KEYS, emptyEntry, entryToForm, entryToPayload, listsToForm, listsToPayload, makeEntrySchema, makeLinkSchema } from './cvSections'

const c = common.en
const issues = (schema, value) => (schema.safeParse(value).error?.issues ?? []).map((issue) => `${issue.path.join('.')}: ${issue.message}`)

describe('entries', () => {
  it('gives every section a blank entry with its own fields, dates and link', () => {
    expect(emptyEntry('skills')).toEqual({ title_ar: '', title_en: '', description_ar: '', description_en: '' })
    expect(emptyEntry('education')).toMatchObject({ degree_ar: '', school_en: '', start: '', end: '', current: false })
    expect(emptyEntry('certifications')).toHaveProperty('url', '')
    expect(emptyEntry('languages')).toEqual({ name_ar: '', name_en: '', level_ar: '', level_en: '' })
  })

  it('round-trips an API entry: null ↔ empty string, no end date while current', () => {
    const api = { title_ar: 'مطور', title_en: 'Developer', company_ar: null, company_en: 'X', location_ar: null, location_en: null, description_ar: null, description_en: null, start: '2022-10', end: '2023-01', current: true }
    const form = entryToForm('experience', api)
    expect(form).toMatchObject({ company_ar: '', company_en: 'X', current: true })
    expect(entryToPayload('experience', form)).toEqual({ ...api, end: null })
  })

  it('requires the main field in both languages and validates months and links', () => {
    const skill = makeEntrySchema(c, 'skills')
    expect(issues(skill, emptyEntry('skills'))).toEqual(['title_ar: This field is required', 'title_en: This field is required'])

    const edu = makeEntrySchema(c, 'education')
    expect(issues(edu, { ...emptyEntry('education'), degree_ar: 'ب', degree_en: 'B', start: '10/2022' })).toEqual(['start: Pick a valid month'])

    const cert = makeEntrySchema(c, 'certifications')
    expect(issues(cert, { ...emptyEntry('certifications'), title_ar: 'ش', title_en: 'C', url: 'nope' })).toHaveLength(1)
  })
})

describe('social links', () => {
  it('needs a known platform and an http(s) url', () => {
    const link = makeLinkSchema(c)
    expect(issues(link, { platform: 'github', url: 'https://github.com/x', label: '' })).toEqual([])
    expect(issues(link, { platform: 'myspace', url: 'https://x', label: '' })).toHaveLength(1)
    expect(issues(link, { platform: 'github', url: '', label: '' })).toContain('url: This field is required')
  })
})

describe('listsToForm / listsToPayload', () => {
  it('covers every section plus the links and drops a label that is not for "other"', () => {
    const form = listsToForm({ social_links: [{ platform: 'github', url: 'https://github.com/x', label: null }] })
    expect(Object.keys(form)).toEqual([...CV_SECTION_KEYS, 'social_links'])
    form.social_links[0].label = 'kept?'
    expect(listsToPayload(form).social_links).toEqual([{ platform: 'github', url: 'https://github.com/x', label: null }])
  })
})
