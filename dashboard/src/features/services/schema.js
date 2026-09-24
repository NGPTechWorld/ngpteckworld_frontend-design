import { z } from 'zod'
import { requiredText } from '@/lib/validation'
import { SERVICE_ICON_KEYS } from './icons'

export const emptyService = {
  icon_key: '',
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  features_ar: [],
  features_en: [],
  is_active: true,
}

/**
 * Validation mirrors the API rules (ServiceController::rules). Built from the common strings `c` so the messages
 * follow the UI language. The server stays the source of truth: its 422 errors are shown on the same fields.
 */
export function makeServiceSchema(c) {
  const feature = z.string().trim().max(255, c.maxLength(255))
  return z.object({
    icon_key: z.enum(SERVICE_ICON_KEYS, { error: c.required }),
    title_ar: requiredText(c, 255),
    title_en: requiredText(c, 255),
    description_ar: requiredText(c, 5000),
    description_en: requiredText(c, 5000),
    features_ar: z.array(feature),
    features_en: z.array(feature),
    is_active: z.boolean(),
  })
}

/** API record → form values (editable fields only; `order` is managed by the reorder mode). */
export const toFormValues = (service) => ({
  icon_key: service.icon_key ?? '',
  title_ar: service.title_ar,
  title_en: service.title_en,
  description_ar: service.description_ar,
  description_en: service.description_en,
  features_ar: [...(service.features_ar ?? [])],
  features_en: [...(service.features_en ?? [])],
  is_active: service.is_active ?? true,
})
