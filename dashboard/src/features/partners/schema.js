import { z } from 'zod'
import { emptyToNull, optionalUrl, requiredText } from '@/lib/validation'

export const emptyPartner = { name: '', url: '', logo: null, is_active: true }

/**
 * Validation mirrors the API rules (PartnerController::rules): the website is optional, an http(s) URL of at most
 * 255 characters. Built from the common strings `c`. The server stays the source of truth (422 → field errors).
 */
export function makePartnerSchema(c) {
  return z.object({
    name: requiredText(c, 255),
    url: z
      .string()
      .trim()
      .pipe(optionalUrl(c).refine((value) => value.length <= 255, { error: c.maxLength(255) })),
    logo: z.string().nullable(),
    is_active: z.boolean(),
  })
}

/** API record → form values (editable fields only; `order` is managed by the reorder mode). */
export const toFormValues = (partner) => ({
  name: partner.name,
  url: partner.url ?? '',
  logo: partner.logo ?? null, // the relative path; the absolute `logo_url` only feeds the preview
  is_active: Boolean(partner.is_active),
})

/** Form values → API body: an empty website / removed logo is sent as null. */
export const toPayload = (values) => ({
  ...values,
  url: emptyToNull(values.url),
  logo: values.logo || null,
})
