import { z } from 'zod'
import { emptyToNull, intField, optionalText, optionalUrl, requiredText } from '@/lib/validation'

export const LIST_FIELDS = ['skills', 'education', 'experience', 'certifications', 'languages']

export const emptyTeamProfile = {
  slug: '',
  name_ar: '', name_en: '',
  job_title_ar: '', job_title_en: '',
  bio_ar: '', bio_en: '',
  avatar: null,
  email: '', phone: '',
  location_ar: '', location_en: '',
  department_ar: '', department_en: '',
  years_experience: '',
  skills_ar: [], skills_en: [],
  education_ar: [], education_en: [],
  experience_ar: [], experience_en: [],
  certifications_ar: [], certifications_en: [],
  languages_ar: [], languages_en: [],
  linkedin_url: '', github_url: '', website_url: '', twitter_url: '',
  is_active: true,
}

const optionalEmail = (c) => z.union([z.literal(''), z.string().trim().email(c.invalidEmail)])

/**
 * Validation mirrors the API rules (TeamProfileController::rules). The server stays the source of truth for the
 * slug format — this only bounds its length — since its 422 errors are shown on the same field either way.
 */
export function makeTeamProfileSchema(c) {
  const tag = z.string().trim().max(255, c.maxLength(255))
  const tags = z.array(tag)
  const schema = {
    slug: optionalText(c, 255),
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
    linkedin_url: optionalUrl(c),
    github_url: optionalUrl(c),
    website_url: optionalUrl(c),
    twitter_url: optionalUrl(c),
    is_active: z.boolean(),
  }

  for (const field of LIST_FIELDS) {
    schema[`${field}_ar`] = tags
    schema[`${field}_en`] = tags
  }

  return z.object(schema)
}

/** API record → form values (editable fields only; `order` is managed by the reorder mode). */
export const toFormValues = (profile) => {
  const values = {
    slug: profile.slug ?? '',
    name_ar: profile.name_ar, name_en: profile.name_en,
    job_title_ar: profile.job_title_ar, job_title_en: profile.job_title_en,
    bio_ar: profile.bio_ar, bio_en: profile.bio_en,
    avatar: profile.avatar ?? null,
    email: profile.email ?? '', phone: profile.phone ?? '',
    location_ar: profile.location_ar ?? '', location_en: profile.location_en ?? '',
    department_ar: profile.department_ar ?? '', department_en: profile.department_en ?? '',
    years_experience: profile.years_experience ?? '',
    linkedin_url: profile.linkedin_url ?? '', github_url: profile.github_url ?? '',
    website_url: profile.website_url ?? '', twitter_url: profile.twitter_url ?? '',
    is_active: Boolean(profile.is_active),
  }

  for (const field of LIST_FIELDS) {
    values[`${field}_ar`] = [...(profile[`${field}_ar`] ?? [])]
    values[`${field}_en`] = [...(profile[`${field}_en`] ?? [])]
  }

  return values
}

/** Form values → API body: blanks become null, an empty slug lets the server (re)generate one. */
export const toPayload = (values) => ({
  ...values,
  slug: emptyToNull(values.slug),
  avatar: values.avatar || null,
  email: emptyToNull(values.email),
  phone: emptyToNull(values.phone),
  location_ar: emptyToNull(values.location_ar),
  location_en: emptyToNull(values.location_en),
  department_ar: emptyToNull(values.department_ar),
  department_en: emptyToNull(values.department_en),
  years_experience: values.years_experience === '' ? null : values.years_experience,
  linkedin_url: emptyToNull(values.linkedin_url),
  github_url: emptyToNull(values.github_url),
  website_url: emptyToNull(values.website_url),
  twitter_url: emptyToNull(values.twitter_url),
})
