import { z } from 'zod'
import { emptyToNull } from '@/lib/validation'

export const SOCIALS = ['facebook', 'instagram', 'linkedin', 'x', 'whatsapp']
export const FIELDS = ['email', 'phone', ...SOCIALS]

/** Mirrors SiteSetting::SECTIONS, grouped the way the form shows them. A missing key means "shown". */
export const SECTION_GROUPS = {
  // one switch hides the page, its menu / footer links and its home-page section
  pages: ['services', 'portfolio', 'team', 'about'],
  home: ['intro', 'stats', 'process', 'promo', 'cta', 'testimonials', 'partners', 'faq'],
}
export const SECTIONS = [...SECTION_GROUPS.pages, ...SECTION_GROUPS.home]

/** Shown as the placeholder and in the hint of each social field. */
export const EXAMPLES = {
  facebook: 'https://facebook.com/your-page',
  instagram: 'https://instagram.com/your-account',
  linkedin: 'https://linkedin.com/company/your-company',
  x: 'https://x.com/your-account',
  whatsapp: 'https://wa.me/963XXXXXXXXX',
}

/**
 * The API stores the launch moment as UTC and sends ISO-8601 with an offset. `datetime-local`
 * inputs have neither a timezone nor an offset — they are a wall clock — so the value is
 * converted to the admin's own local time on the way in and back to a real instant on the way out.
 * Skipping that is how a launch set for 11:11 fires at 08:11.
 */
const toLocalInput = (iso) => {
  if (!iso) return ''
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`
}

/** API record → form values (null → ''; every section is a boolean, shown unless the API says otherwise). */
export const toFormValues = (settings) => ({
  ...Object.fromEntries(FIELDS.map((key) => [key, settings?.[key] ?? ''])),
  sections: Object.fromEntries(SECTIONS.map((key) => [key, settings?.sections?.[key] ?? true])),
  launch_enabled: Boolean(settings?.launch_enabled),
  launch_at: toLocalInput(settings?.launch_at),
  visitor_counter_enabled: Boolean(settings?.visitor_counter_enabled),
})

const optionalEmail = (c) =>
  z
    .string()
    .trim()
    .max(255, c.maxLength(255))
    .refine((value) => value === '' || z.email().safeParse(value).success, { error: c.invalidEmail })

const optionalHttpUrl = (c) =>
  z
    .string()
    .trim()
    .max(255, c.maxLength(255))
    .refine((value) => value === '' || /^https?:\/\/\S+$/i.test(value), { error: c.invalidUrl })

/** Mirrors SettingsController::update. Every field is optional: an empty one clears it on the site. */
export function makeSettingsSchema(c) {
  return z.object({
    email: optionalEmail(c),
    phone: z.string().trim().max(40, c.maxLength(40)),
    ...Object.fromEntries(SOCIALS.map((key) => [key, optionalHttpUrl(c)])),
    sections: z.object(Object.fromEntries(SECTIONS.map((key) => [key, z.boolean()]))),
    // Defaulted rather than required: the form always supplies both, and a schema that rejects a
    // partial object makes every caller that validates one field carry the launch fields too.
    launch_enabled: z.boolean().default(false),
    launch_at: z.string().default(''),
    visitor_counter_enabled: z.boolean().default(false),
  }).refine((values) => !values.launch_enabled || values.launch_at !== '', {
    // A switch with no date does nothing at all on the site, which looks like a broken feature
    // rather than a missing field. Say so here instead.
    path: ['launch_at'],
    error: c.launchNeedsDate,
  })
}

/**
 * Only the fields the user changed are sent (the API accepts partial updates), so saving one field can never
 * overwrite another one that was edited elsewhere in the meantime. '' becomes null = "clear it".
 */
export function toPayload(values, dirtyFields) {
  const payload = {}
  for (const key of FIELDS) {
    if (dirtyFields[key]) payload[key] = emptyToNull(values[key])
  }
  // the API merges `sections` key by key too, so only the switches that changed are sent
  const sections = SECTIONS.filter((key) => dirtyFields.sections?.[key])
  if (sections.length) payload.sections = Object.fromEntries(sections.map((key) => [key, values.sections[key]]))

  if (dirtyFields.visitor_counter_enabled) payload.visitor_counter_enabled = values.visitor_counter_enabled
  if (dirtyFields.launch_enabled) payload.launch_enabled = values.launch_enabled
  if (dirtyFields.launch_at) {
    // new Date() on a `datetime-local` value reads it as local time, and toISOString converts it
    // to the instant the admin actually meant.
    payload.launch_at = values.launch_at ? new Date(values.launch_at).toISOString() : null
  }
  return payload
}
