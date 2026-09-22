import { z } from 'zod'
import { emptyToNull } from '@/lib/validation'

export const SOCIALS = ['facebook', 'instagram', 'linkedin', 'x', 'whatsapp']
export const FIELDS = ['email', 'phone', ...SOCIALS]

/** Shown as the placeholder and in the hint of each social field. */
export const EXAMPLES = {
  facebook: 'https://facebook.com/your-page',
  instagram: 'https://instagram.com/your-account',
  linkedin: 'https://linkedin.com/company/your-company',
  x: 'https://x.com/your-account',
  whatsapp: 'https://wa.me/963XXXXXXXXX',
}

/** API record → form values (null → ''). */
export const toFormValues = (settings) => Object.fromEntries(FIELDS.map((key) => [key, settings?.[key] ?? '']))

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
  return payload
}
