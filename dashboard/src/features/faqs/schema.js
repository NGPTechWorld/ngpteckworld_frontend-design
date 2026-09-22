import { z } from 'zod'
import { requiredText } from '@/lib/validation'

export const emptyFaq = { question_ar: '', question_en: '', answer_ar: '', answer_en: '', is_active: true }

/**
 * Validation mirrors the API rules (FaqController::rules). Built from the common strings `c` so the messages follow
 * the UI language. The server stays the source of truth: its 422 errors are shown on the same fields.
 */
export function makeFaqSchema(c) {
  return z.object({
    question_ar: requiredText(c, 255),
    question_en: requiredText(c, 255),
    answer_ar: requiredText(c, 5000),
    answer_en: requiredText(c, 5000),
    is_active: z.boolean(),
  })
}

/** API record → form values (editable fields only). */
export const toFormValues = (faq) => ({
  question_ar: faq.question_ar,
  question_en: faq.question_en,
  answer_ar: faq.answer_ar,
  answer_en: faq.answer_en,
  is_active: Boolean(faq.is_active),
})
