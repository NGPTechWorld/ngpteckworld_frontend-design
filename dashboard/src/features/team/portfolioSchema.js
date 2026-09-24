import { z } from 'zod'
import { galleryPaths, toGalleryItems } from '@/ui'
import { emptyToNull, optionalText, optionalUrl, requiredText } from '@/lib/validation'

export const GALLERY_MAX = 20

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

export const emptyPortfolioItem = () => ({
  title_ar: '', title_en: '',
  subtitle_ar: '', subtitle_en: '',
  description_ar: '', description_en: '',
  cover_image: null,
  gallery: [],
  video_url: '',
  link_url: '',
  start_date: '', end_date: '', is_current: false,
})

/** Validation mirrors the API rules (TeamPortfolioItemController::rules). */
export const makePortfolioItemSchema = (c) => {
  const month = z.union([z.literal(''), z.string().regex(MONTH, c.invalidMonth)])
  return z.object({
    title_ar: requiredText(c, 255),
    title_en: requiredText(c, 255),
    subtitle_ar: optionalText(c, 255),
    subtitle_en: optionalText(c, 255),
    description_ar: requiredText(c, 5000),
    description_en: requiredText(c, 5000),
    cover_image: z.string().nullable(),
    gallery: z.array(z.object({ path: z.string(), url: z.string().nullable().optional() })).max(GALLERY_MAX, c.maxLength(GALLERY_MAX)),
    video_url: optionalUrl(c),
    link_url: optionalUrl(c),
    start_date: month,
    end_date: month,
    is_current: z.boolean(),
  })
}

/** API record → form values. The gallery becomes `[{ path, url }]` items (what <GalleryUpload> works with). */
export const portfolioItemToFormValues = (item) => ({
  title_ar: item.title_ar ?? '',
  title_en: item.title_en ?? '',
  subtitle_ar: item.subtitle_ar ?? '',
  subtitle_en: item.subtitle_en ?? '',
  description_ar: item.description_ar ?? '',
  description_en: item.description_en ?? '',
  cover_image: item.cover_image ?? null,
  gallery: toGalleryItems(item.gallery, item.gallery_urls),
  video_url: item.video_url ?? '',
  link_url: item.link_url ?? '',
  start_date: item.start_date ?? '',
  end_date: item.end_date ?? '',
  is_current: Boolean(item.is_current),
})

/** Form values → API body: images as relative paths, gallery as paths only, blanks as null, no end date while ongoing. */
export const portfolioItemToPayload = (values) => ({
  title_ar: values.title_ar,
  title_en: values.title_en,
  subtitle_ar: emptyToNull(values.subtitle_ar),
  subtitle_en: emptyToNull(values.subtitle_en),
  description_ar: values.description_ar,
  description_en: values.description_en,
  cover_image: values.cover_image ?? null,
  gallery: galleryPaths(values.gallery),
  video_url: emptyToNull(values.video_url),
  link_url: emptyToNull(values.link_url),
  start_date: emptyToNull(values.start_date),
  end_date: values.is_current ? null : emptyToNull(values.end_date),
  is_current: values.is_current,
})
