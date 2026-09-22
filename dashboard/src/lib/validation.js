import { z } from 'zod'

// Small zod building blocks that mirror the API rules. `c` is the common string table (`useCommon()`), so the
// messages follow the UI language. Build schemas inside `useMemo(() => makeSchema(c), [c])`.

/** Required text (trimmed) with the API's max length: requiredText(c, 255) */
export const requiredText = (c, max = 255) => z.string().trim().min(1, c.required).max(max, c.maxLength(max))

/** Optional text: '' is accepted — turn it into null before sending with emptyToNull(). */
export const optionalText = (c, max = 255) => z.string().trim().max(max, c.maxLength(max))

/** Optional http(s) URL: '' is accepted. */
export const optionalUrl = (c) =>
  z.union([z.literal(''), z.string().trim().regex(/^https?:\/\/\S+$/i, c.invalidUrl)], { error: c.invalidUrl })

/** Required http(s) URL. */
export const requiredUrl = (c) => z.string().trim().min(1, c.required).regex(/^https?:\/\/\S+$/i, c.invalidUrl)

/** Required email. */
export const requiredEmail = (c) => z.string().trim().min(1, c.required).email(c.invalidEmail)

/** Integer typed into an <input> (comes in as a string), optionally within [min, max]. */
export function intField(c, { min, max } = {}) {
  let schema = z.coerce
    .number({ error: (issue) => (issue.code === 'invalid_type' ? c.invalidNumber : undefined) })
    .int(c.invalidNumber)
  if (min !== undefined) schema = schema.min(min, c.numberRange(min, max ?? '∞'))
  if (max !== undefined) schema = schema.max(max, c.numberRange(min ?? '−∞', max))
  return schema
}

/** '' / undefined → null (nullable API fields); other values pass through. */
export const emptyToNull = (value) => (value === '' || value === undefined ? null : value)

/** New passwords: 8–255 characters, never trimmed (spaces may be intentional). */
export const newPassword = (c) => z.string().min(1, c.required).min(8, c.minLength(8)).max(255, c.maxLength(255))
