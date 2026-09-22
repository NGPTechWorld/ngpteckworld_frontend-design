import { z } from 'zod'
import { requiredText } from '@/lib/validation'

export const emptyStat = { value: '', label_ar: '', label_en: '' }

/**
 * Validation mirrors the API rules (SiteStatController::rules): `value` is a string of at most 20 characters
 * ("240+", "98%"), the label is required in both languages. Built from the common strings `c`.
 */
export function makeStatSchema(c) {
  return z.object({
    value: requiredText(c, 20),
    label_ar: requiredText(c, 255),
    label_en: requiredText(c, 255),
  })
}

/** API record → form values (editable fields only; `order` is managed by the reorder mode). */
export const toFormValues = (stat) => ({
  value: stat.value ?? '',
  label_ar: stat.label_ar,
  label_en: stat.label_en,
})
