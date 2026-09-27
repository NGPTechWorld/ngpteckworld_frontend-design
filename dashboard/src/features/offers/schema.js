import { z } from 'zod'
import { galleryPaths, toGalleryItems } from '@/ui'
import { emptyToNull, optionalText, optionalUrl, requiredText } from '@/lib/validation'

export const GALLERY_MAX = 30

/** Mirrors App\Support\OfferSections: the offer's features and its subscription plans, all bilingual. */
export const emptyFeature = () => ({ title_ar: '', title_en: '', description_ar: '', description_en: '' })
export const emptyPlan = () => ({ name_ar: '', name_en: '', price_ar: '', price_en: '', description_ar: '', description_en: '', highlighted: false })

export const emptyOffer = {
  slug: '',
  title_ar: '', title_en: '',
  short_ar: '', short_en: '',
  description_ar: '', description_en: '',
  cover_image: null,
  gallery: [],
  video_url: '',
  features: [],
  plans: [],
  plans_note_ar: '', plans_note_en: '',
  is_active: true,
}

/** Validation mirrors the API rules (OfferController::rules + OfferSections::rules). */
export function makeOfferSchema(c) {
  return z.object({
    slug: optionalText(c, 255),
    title_ar: requiredText(c, 255),
    title_en: requiredText(c, 255),
    short_ar: requiredText(c, 500),
    short_en: requiredText(c, 500),
    description_ar: requiredText(c, 10000),
    description_en: requiredText(c, 10000),
    cover_image: z.string().nullable(),
    gallery: z.array(z.object({ path: z.string(), url: z.string().nullable().optional() })).max(GALLERY_MAX, c.maxLength(GALLERY_MAX)),
    video_url: optionalUrl(c),
    features: z.array(z.object({
      title_ar: requiredText(c, 255),
      title_en: requiredText(c, 255),
      description_ar: optionalText(c, 2000),
      description_en: optionalText(c, 2000),
    })).max(50),
    plans: z.array(z.object({
      name_ar: requiredText(c, 255),
      name_en: requiredText(c, 255),
      price_ar: optionalText(c, 100),
      price_en: optionalText(c, 100),
      description_ar: optionalText(c, 2000),
      description_en: optionalText(c, 2000),
      highlighted: z.boolean(),
    })).max(10),
    plans_note_ar: optionalText(c, 5000),
    plans_note_en: optionalText(c, 5000),
    is_active: z.boolean(),
  })
}

const blank = (value) => value ?? ''

/** API record → form values (null → ''; the gallery becomes `[{ path, url }]` items for <GalleryUpload>). */
export const toFormValues = (offer) => ({
  slug: offer.slug ?? '',
  title_ar: offer.title_ar, title_en: offer.title_en,
  short_ar: offer.short_ar, short_en: offer.short_en,
  description_ar: offer.description_ar, description_en: offer.description_en,
  cover_image: offer.cover_image ?? null,
  gallery: toGalleryItems(offer.gallery, offer.gallery_urls),
  video_url: offer.video_url ?? '',
  features: (offer.features ?? []).map((f) => ({ title_ar: f.title_ar, title_en: f.title_en, description_ar: blank(f.description_ar), description_en: blank(f.description_en) })),
  plans: (offer.plans ?? []).map((p) => ({
    name_ar: p.name_ar, name_en: p.name_en,
    price_ar: blank(p.price_ar), price_en: blank(p.price_en),
    description_ar: blank(p.description_ar), description_en: blank(p.description_en),
    highlighted: Boolean(p.highlighted),
  })),
  plans_note_ar: offer.plans_note_ar ?? '', plans_note_en: offer.plans_note_en ?? '',
  is_active: Boolean(offer.is_active),
})

/** Form values → API body: blanks become null, the gallery is sent as paths only. */
export const toPayload = (values) => ({
  ...values,
  slug: emptyToNull(values.slug),
  cover_image: values.cover_image || null,
  gallery: galleryPaths(values.gallery),
  video_url: emptyToNull(values.video_url),
  features: values.features.map((f) => ({ ...f, description_ar: emptyToNull(f.description_ar), description_en: emptyToNull(f.description_en) })),
  plans: values.plans.map((p) => ({
    ...p,
    price_ar: emptyToNull(p.price_ar), price_en: emptyToNull(p.price_en),
    description_ar: emptyToNull(p.description_ar), description_en: emptyToNull(p.description_en),
  })),
  plans_note_ar: emptyToNull(values.plans_note_ar),
  plans_note_en: emptyToNull(values.plans_note_en),
})
