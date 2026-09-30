import { z } from 'zod'
import { emptyToNull, intField, optionalText, requiredText } from '@/lib/validation'

export const emptyBook = {
  slug: '',
  title_ar: '', title_en: '',
  author_ar: '', author_en: '',
  description_ar: '', description_en: '',
  category_ar: '', category_en: '',
  language_ar: '', language_en: '',
  pages: '',
  year: '',
  cover_image: null,
  file_path: null,
  allow_download: true,
  is_active: true,
}

/** Validation mirrors the API rules (Admin\BookController::rules). */
export function makeBookSchema(c) {
  return z.object({
    slug: optionalText(c, 255),
    title_ar: requiredText(c, 255),
    title_en: requiredText(c, 255),
    author_ar: optionalText(c, 255),
    author_en: optionalText(c, 255),
    description_ar: requiredText(c, 10000),
    description_en: requiredText(c, 10000),
    category_ar: optionalText(c, 255),
    category_en: optionalText(c, 255),
    language_ar: optionalText(c, 100),
    language_en: optionalText(c, 100),
    pages: z.union([z.literal(''), intField(c, { min: 1, max: 100000 })]),
    year: z.union([z.literal(''), intField(c, { min: 1000, max: 2100 })]),
    cover_image: z.string().nullable(),
    // the PDF is the book: it has to be uploaded
    file_path: z.string({ error: c.required }).min(1, c.required),
    allow_download: z.boolean(),
    is_active: z.boolean(),
  })
}

const TEXT = ['author_ar', 'author_en', 'category_ar', 'category_en', 'language_ar', 'language_en']

/** API record → form values (null → ''). */
export const toFormValues = (book) => ({
  slug: book.slug ?? '',
  title_ar: book.title_ar, title_en: book.title_en,
  description_ar: book.description_ar, description_en: book.description_en,
  ...Object.fromEntries(TEXT.map((key) => [key, book[key] ?? ''])),
  pages: book.pages ?? '',
  year: book.year ?? '',
  cover_image: book.cover_image ?? null,
  file_path: book.file_path ?? null,
  allow_download: Boolean(book.allow_download),
  is_active: Boolean(book.is_active),
})

/** Form values → API body: blanks become null. */
export const toPayload = (values) => ({
  ...values,
  slug: emptyToNull(values.slug),
  ...Object.fromEntries(TEXT.map((key) => [key, emptyToNull(values[key])])),
  pages: values.pages === '' ? null : Number(values.pages),
  year: values.year === '' ? null : Number(values.year),
  cover_image: values.cover_image || null,
})
