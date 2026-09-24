import { z } from 'zod'
import { emptyToNull, intField, optionalText, requiredText } from '@/lib/validation'
import { listsToForm, listsToPayload, makeListsShape } from './cvSections'

/** Fields only the team admins manage; the member editing their own profile ("My portfolio") never sees them. */
export const ADMIN_ONLY_FIELDS = ['slug', 'user_id', 'is_active']

export const emptyTeamProfile = {
  slug: '',
  user_id: '',
  name_ar: '', name_en: '',
  job_title_ar: '', job_title_en: '',
  bio_ar: '', bio_en: '',
  avatar: null,
  email: '', phone: '',
  location_ar: '', location_en: '',
  department_ar: '', department_en: '',
  years_experience: '',
  ...listsToForm({}),
  is_active: true,
}

const optionalEmail = (c) => z.union([z.literal(''), z.string().trim().email(c.invalidEmail)])

/**
 * Validation mirrors the API rules (TeamProfileController::rules + TeamProfileSections). The server stays the
 * source of truth for the slug format — this only bounds its length — since its 422 errors are shown on the same
 * field either way. `self` (a member editing their own profile) leaves out the admin-only fields.
 */
export function makeTeamProfileSchema(c, { self = false } = {}) {
  const schema = {
    slug: optionalText(c, 255),
    user_id: z.union([z.literal(''), z.coerce.number().int()]),
    name_ar: requiredText(c, 255),
    name_en: requiredText(c, 255),
    job_title_ar: requiredText(c, 255),
    job_title_en: requiredText(c, 255),
    bio_ar: requiredText(c, 5000),
    bio_en: requiredText(c, 5000),
    avatar: z.string().nullable(),
    email: optionalEmail(c),
    phone: optionalText(c, 40),
    location_ar: optionalText(c, 255),
    location_en: optionalText(c, 255),
    department_ar: optionalText(c, 255),
    department_en: optionalText(c, 255),
    years_experience: z.union([z.literal(''), intField(c, { min: 0, max: 80 })]),
    ...makeListsShape(c),
    is_active: z.boolean(),
  }

  if (self) for (const field of ADMIN_ONLY_FIELDS) delete schema[field]

  return z.object(schema)
}

/** API record → form values (editable fields only; `order` is managed by the reorder mode). */
export const toFormValues = (profile) => ({
  slug: profile.slug ?? '',
  user_id: profile.user_id ?? '',
  name_ar: profile.name_ar, name_en: profile.name_en,
  job_title_ar: profile.job_title_ar, job_title_en: profile.job_title_en,
  bio_ar: profile.bio_ar, bio_en: profile.bio_en,
  avatar: profile.avatar ?? null,
  email: profile.email ?? '', phone: profile.phone ?? '',
  location_ar: profile.location_ar ?? '', location_en: profile.location_en ?? '',
  department_ar: profile.department_ar ?? '', department_en: profile.department_en ?? '',
  years_experience: profile.years_experience ?? '',
  ...listsToForm(profile),
  is_active: Boolean(profile.is_active),
})

/** Form values → API body: blanks become null, an empty slug lets the server (re)generate one. */
export const toPayload = (values) => {
  const payload = {
    ...values,
    avatar: values.avatar || null,
    email: emptyToNull(values.email),
    phone: emptyToNull(values.phone),
    location_ar: emptyToNull(values.location_ar),
    location_en: emptyToNull(values.location_en),
    department_ar: emptyToNull(values.department_ar),
    department_en: emptyToNull(values.department_en),
    years_experience: values.years_experience === '' ? null : values.years_experience,
    ...listsToPayload(values),
  }
  if ('slug' in values) payload.slug = emptyToNull(values.slug)
  if ('user_id' in values) payload.user_id = values.user_id === '' ? null : values.user_id
  return payload
}

/** A member's own profile: the same form without the admin-only fields. */
export const toSelfFormValues = (profile) => {
  const values = toFormValues(profile)
  for (const field of ADMIN_ONLY_FIELDS) delete values[field]
  return values
}
