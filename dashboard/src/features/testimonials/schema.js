import { z } from 'zod'
import { emptyToNull, optionalText, requiredText } from '@/lib/validation'

export const emptyTestimonial = { name: '', company: '', quote_ar: '', quote_en: '', rating: 5, avatar: null, is_active: true }

/**
 * Validation mirrors the API rules (TestimonialController::rules). Built from the common strings `c` so the
 * messages follow the UI language. The server stays the source of truth: its 422 errors are shown on the same fields.
 */
export function makeTestimonialSchema(c) {
  const range = c.numberRange(1, 5)
  return z.object({
    name: requiredText(c, 255),
    company: optionalText(c, 255),
    quote_ar: requiredText(c, 2000),
    quote_en: requiredText(c, 2000),
    rating: z.number({ error: c.required }).int(range).min(1, range).max(5, range),
    avatar: z.string().nullable(),
    is_active: z.boolean(),
  })
}

/** API record → form values (editable fields only; `order` is managed by the reorder mode). */
export const toFormValues = (testimonial) => ({
  name: testimonial.name,
  company: testimonial.company ?? '',
  quote_ar: testimonial.quote_ar,
  quote_en: testimonial.quote_en,
  rating: testimonial.rating,
  avatar: testimonial.avatar ?? null, // the relative path; the absolute `avatar_url` only feeds the preview
  is_active: Boolean(testimonial.is_active),
})

/** Form values → API body: an empty company / removed avatar is sent as null. */
export const toPayload = (values) => ({
  ...values,
  company: emptyToNull(values.company),
  avatar: values.avatar || null,
})
