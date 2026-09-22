import { describe, expect, it } from 'vitest'
import common from '@/i18n/common'
import { FIELDS, SOCIALS, makeSettingsSchema, toFormValues, toPayload } from './schema'

const schema = makeSettingsSchema(common.en)
const empty = Object.fromEntries(FIELDS.map((key) => [key, '']))
const issues = (values) => (schema.safeParse({ ...empty, ...values }).error?.issues ?? []).map((issue) => `${issue.path.join('.')}: ${issue.message}`)

describe('toFormValues', () => {
  it('turns null into empty strings and covers every field', () => {
    expect(toFormValues({ email: 'a@b.co', phone: null, facebook: null })).toEqual({ ...empty, email: 'a@b.co' })
    expect(toFormValues(undefined)).toEqual(empty)
    expect(Object.keys(toFormValues({}))).toEqual(FIELDS)
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
})
