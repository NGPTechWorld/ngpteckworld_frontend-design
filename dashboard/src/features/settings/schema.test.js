import { describe, expect, it } from 'vitest'
import common from '@/i18n/common'
import { FIELDS, SECTIONS, SOCIALS, makeSettingsSchema, toFormValues, toPayload } from './schema'

const schema = makeSettingsSchema(common.en)
const allShown = Object.fromEntries(SECTIONS.map((key) => [key, true]))
const empty = { ...Object.fromEntries(FIELDS.map((key) => [key, ''])), sections: allShown, launch_enabled: false, launch_at: '' }
const issues = (values) => (schema.safeParse({ ...empty, ...values }).error?.issues ?? []).map((issue) => `${issue.path.join('.')}: ${issue.message}`)

describe('toFormValues', () => {
  it('turns null into empty strings and covers every field', () => {
    expect(toFormValues({ email: 'a@b.co', phone: null, facebook: null })).toEqual({ ...empty, email: 'a@b.co' })
    expect(toFormValues(undefined)).toEqual(empty)
    expect(Object.keys(toFormValues({}))).toEqual([...FIELDS, 'sections', 'launch_enabled', 'launch_at'])
  })

  it('shows every section the API does not mention', () => {
    expect(toFormValues({ sections: { faq: false, team: false } }).sections).toEqual({ ...allShown, faq: false, team: false })
  })
})

describe('makeSettingsSchema', () => {
  it('accepts empty fields (they hide the item on the site)', () => {
    expect(issues({})).toEqual([])
  })

  it('accepts an email, a phone and http(s) links', () => {
    expect(issues({ email: 'info@ngptechworld.com', phone: '+963 933 069 105', facebook: 'https://facebook.com/x', x: 'http://x.com/y', whatsapp: 'https://wa.me/963933069105' })).toEqual([])
  })

  it('rejects an invalid email and links that are not http(s) URLs', () => {
    expect(issues({ email: 'nope' })).toEqual(['email: Enter a valid email address'])
    for (const key of SOCIALS) expect(issues({ [key]: 'facebook.com/x' })).toEqual([`${key}: Enter a valid URL (starting with http:// or https://)`])
    expect(issues({ facebook: 'ftp://files.example.com' })).toHaveLength(1)
    expect(issues({ facebook: 'https://has space.com' })).toHaveLength(1)
  })

  it('mirrors the API length limits', () => {
    expect(issues({ phone: '1'.repeat(41) })).toEqual(['phone: At most 40 characters'])
    expect(issues({ facebook: `https://x.com/${'a'.repeat(250)}` })).toEqual(['facebook: At most 255 characters'])
  })

  it('trims whitespace', () => {
    expect(schema.parse({ ...empty, phone: '  +963  ', facebook: '  https://facebook.com/x ' })).toMatchObject({ phone: '+963', facebook: 'https://facebook.com/x' })
  })
})

describe('toPayload', () => {
  it('contains only the changed fields, with cleared ones as null', () => {
    const values = { ...empty, phone: '+1 555', facebook: '', email: 'a@b.co', instagram: 'https://instagram.com/x' }
    expect(toPayload(values, { phone: true, facebook: true })).toEqual({ phone: '+1 555', facebook: null })
    expect(toPayload(values, {})).toEqual({})
    expect(toPayload(values, { unknown: true })).toEqual({})
  })

  it('sends only the section switches that changed', () => {
    const values = { ...empty, sections: { ...allShown, faq: false, partners: false } }
    expect(toPayload(values, { sections: { faq: true } })).toEqual({ sections: { faq: false } })
    expect(toPayload(values, { sections: { faq: true, stats: true }, phone: true })).toEqual({ phone: null, sections: { faq: false, stats: true } })
    expect(toPayload(values, { sections: {} })).toEqual({})
  })
})

describe('launch countdown', () => {
  it('will not let the countdown run without a moment to count to', () => {
    // A switch on with no date does nothing on the site, which reads as a broken feature.
    expect(issues({ launch_enabled: true, launch_at: '' })).toEqual([
      'launch_at: Set the launch time for the countdown to run.',
    ])
    expect(issues({ launch_enabled: true, launch_at: '2026-09-25T11:11' })).toEqual([])
    expect(issues({ launch_enabled: false, launch_at: '' })).toEqual([])
  })

  it('sends the moment as a real instant, not a wall clock', () => {
    const payload = toPayload(
      { ...empty, launch_enabled: true, launch_at: '2026-09-25T11:11' },
      { launch_enabled: true, launch_at: true },
    )
    expect(payload.launch_enabled).toBe(true)
    // What the admin typed is their local 11:11; what the API stores is that same instant in UTC.
    expect(payload.launch_at).toBe(new Date('2026-09-25T11:11').toISOString())
  })

  it('clears the moment rather than sending an empty string', () => {
    const payload = toPayload({ ...empty, launch_at: '' }, { launch_at: true })
    expect(payload.launch_at).toBeNull()
  })

  it('leaves the launch fields out when they were not touched', () => {
    expect(toPayload({ ...empty, launch_enabled: true }, { email: true })).toEqual({ email: null })
  })
})
