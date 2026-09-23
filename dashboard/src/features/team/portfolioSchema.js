import { z } from 'zod'
import { galleryPaths, toGalleryItems } from '@/ui'
import { emptyToNull, optionalUrl, requiredText } from '@/lib/validation'

export const GALLERY_MAX = 20

export const emptyPortfolioItem = () => ({
  title_ar: '', title_en: '',
  description_ar: '', description_en: '',
  cover_image: null,
  gallery: [],
  video_url: '',
})

/** Validation mirrors the API rules (TeamPortfolioItemController::rules). */
export const makePortfolioItemSchema = (c) =>
  z.object({
    title_ar: requiredText(c, 255),
    title_en: requiredText(c, 255),
    description_ar: requiredText(c, 5000),
    description_en: requiredText(c, 5000),
    cover_image: z.string().nullable(),
    gallery: z.array(z.object({ path: z.string(), url: z.string().nullable().optional() })).max(GALLERY_MAX, c.maxLength(GALLERY_MAX)),
    video_url: optionalUrl(c),
  })

/** API record → form values. The gallery becomes `[{ path, url }]` items (what <GalleryUpload> works with). */
export const portfolioItemToFormValues = (item) => ({
  title_ar: item.title_ar ?? '',
  title_en: item.title_en ?? '',
  description_ar: item.description_ar ?? '',
  description_en: item.description_en ?? '',
  cover_image: item.cover_image ?? null,
  gallery: toGalleryItems(item.gallery, item.gallery_urls),
  video_url: item.video_url ?? '',
})

/** Form values → API body: images as relative paths, gallery as paths only, a blank video url as null. */
export const portfolioItemToPayload = (values) => ({
  title_ar: values.title_ar,
  title_en: values.title_en,
  description_ar: values.description_ar,
  description_en: values.description_en,
  cover_image: values.cover_image ?? null,
  gallery: galleryPaths(values.gallery),
  video_url: emptyToNull(values.video_url),
})
