import { z } from 'zod'
import { emptyToNull, optionalText, requiredText } from '@/lib/validation'

/**
 * The CV sections of a team profile and its social links. Mirrors App\Support\TeamProfileSections on the API:
 * every text field is bilingual (`title_ar` / `title_en`), dates are months ("2024-10") and an entry with
 * `current` has no end date ("present").
 *
 *   fields  bilingual field → required?
 *   dates   has start / end / current
 *   url     has a link
 */
export const CV_SECTIONS = {
  skills: { fields: { title: true, description: false }, dates: false, url: false },
  experience: { fields: { title: true, company: false, location: false, description: false }, dates: true, url: false },
  education: { fields: { degree: true, school: false, location: false, description: false }, dates: true, url: false },
  certifications: { fields: { title: true, description: false }, dates: false, url: true },
  languages: { fields: { name: true, level: false }, dates: false, url: false },
}

export const CV_SECTION_KEYS = Object.keys(CV_SECTIONS)

/** Free-text fields (a textarea, 5000 characters); the others are one-liners (255). */
export const LONG_FIELDS = ['description']

export const MAX_ENTRIES = 50
export const MAX_LINKS = 20

/** Networks the public page has an icon for; `other` shows the link's own label. */
export const PLATFORMS = ['linkedin', 'github', 'website', 'x', 'facebook', 'instagram', 'youtube', 'behance', 'dribbble', 'telegram', 'whatsapp', 'other']

const LANGS = ['ar', 'en']
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

const textKeys = (section) => Object.keys(CV_SECTIONS[section].fields).flatMap((field) => LANGS.map((lang) => `${field}_${lang}`))

/** A blank entry of a section, as form values. */
export function emptyEntry(section) {
  const spec = CV_SECTIONS[section]
  const entry = Object.fromEntries(textKeys(section).map((key) => [key, '']))
  if (spec.dates) Object.assign(entry, { start: '', end: '', current: false })
  if (spec.url) entry.url = ''
  return entry
}

/** API entry → form values (null → ''). */
export function entryToForm(section, entry) {
  const values = emptyEntry(section)
  for (const key of Object.keys(values)) {
    if (key === 'current') values.current = Boolean(entry?.current)
    else values[key] = entry?.[key] ?? ''
  }
  return values
}

/** Form values → API entry ('' → null; a current entry has no end date). */
export function entryToPayload(section, values) {
  const out = {}
  for (const [key, value] of Object.entries(entryToForm(section, values))) {
    out[key] = key === 'current' ? value : emptyToNull(typeof value === 'string' ? value.trim() : value)
  }
  if (out.current) out.end = null
  return out
}

/** Validation of one entry, mirroring TeamProfileSections::rules. */
export function makeEntrySchema(c, section) {
  const spec = CV_SECTIONS[section]
  const shape = {}
  for (const [field, required] of Object.entries(spec.fields)) {
    const max = LONG_FIELDS.includes(field) ? 5000 : 255
    for (const lang of LANGS) shape[`${field}_${lang}`] = required ? requiredText(c, max) : optionalText(c, max)
  }
  if (spec.dates) {
    const month = z.union([z.literal(''), z.string().regex(MONTH, c.invalidMonth)])
    Object.assign(shape, { start: month, end: month, current: z.boolean() })
  }
  if (spec.url) shape.url = z.union([z.literal(''), z.string().trim().max(255, c.maxLength(255)).regex(/^https?:\/\/\S+$/i, c.invalidUrl)])
  return z.object(shape)
}

export const emptyLink = () => ({ platform: 'linkedin', url: '', label: '' })

export const linkToForm = (link) => ({ platform: link?.platform ?? 'other', url: link?.url ?? '', label: link?.label ?? '' })

/** A label is only kept for "other" (the API drops it for the named networks). */
export const linkToPayload = (values) => ({
  platform: values.platform,
  url: values.url.trim(),
  label: values.platform === 'other' ? emptyToNull(values.label.trim()) : null,
})

export const makeLinkSchema = (c) =>
  z.object({
    platform: z.enum(PLATFORMS, { error: c.required }),
    url: z.string().trim().min(1, c.required).max(255, c.maxLength(255)).regex(/^https?:\/\/\S+$/i, c.invalidUrl),
    label: optionalText(c, 60),
  })

/** Zod shape of every list: `{ skills: z.array(…), …, social_links: z.array(…) }`. */
export function makeListsShape(c) {
  const shape = Object.fromEntries(CV_SECTION_KEYS.map((section) => [section, z.array(makeEntrySchema(c, section)).max(MAX_ENTRIES)]))
  shape.social_links = z.array(makeLinkSchema(c)).max(MAX_LINKS)
  return shape
}

/** Every list of an API profile → form values. */
export function listsToForm(profile) {
  const values = Object.fromEntries(CV_SECTION_KEYS.map((section) => [section, (profile?.[section] ?? []).map((entry) => entryToForm(section, entry))]))
  values.social_links = (profile?.social_links ?? []).map(linkToForm)
  return values
}

/** Every list of the form → API body. */
export function listsToPayload(values) {
  const payload = Object.fromEntries(CV_SECTION_KEYS.map((section) => [section, (values[section] ?? []).map((entry) => entryToPayload(section, entry))]))
  payload.social_links = (values.social_links ?? []).map(linkToPayload)
  return payload
}
