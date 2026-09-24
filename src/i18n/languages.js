/**
 * The languages the public site speaks.
 *
 * `content` is the field that matters most here, and it is why this file exists rather than a
 * plain array of codes. Everything the dashboard owns — services, projects, team profiles,
 * testimonials, FAQs, the thirty-nine marketing texts — lives in the database as `_ar` / `_en`
 * column pairs and nothing else. A German reader therefore gets a German interface and English
 * records, and `content` is what encodes that: it maps every European locale onto `en`.
 *
 * Drop it and `obj[`title_${lang}`]` looks for `title_de`, finds nothing, and every card on the
 * page renders blank. That failure is silent, which is exactly why the mapping is data here
 * instead of a condition scattered through the components.
 *
 * Adding a language means: a file in ./locales, an entry below, and nothing else.
 */

export const LANGUAGES = [
  { code: 'ar', label: 'العربية', english: 'Arabic', dir: 'rtl', content: 'ar' },
  { code: 'en', label: 'English', english: 'English', dir: 'ltr', content: 'en' },
  { code: 'de', label: 'Deutsch', english: 'German', dir: 'ltr', content: 'en' },
  { code: 'es', label: 'Español', english: 'Spanish', dir: 'ltr', content: 'en' },
  { code: 'fr', label: 'Français', english: 'French', dir: 'ltr', content: 'en' },
  { code: 'it', label: 'Italiano', english: 'Italian', dir: 'ltr', content: 'en' },
  { code: 'nl', label: 'Nederlands', english: 'Dutch', dir: 'ltr', content: 'en' },
  { code: 'pt', label: 'Português', english: 'Portuguese', dir: 'ltr', content: 'en' },
  { code: 'ru', label: 'Русский', english: 'Russian', dir: 'ltr', content: 'en' },
  { code: 'tr', label: 'Türkçe', english: 'Turkish', dir: 'ltr', content: 'en' },
]

/** Arabic: the company's own language, and the one an unrecognised visitor should land in. */
export const DEFAULT_LANG = 'ar'

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]))

export const isLang = (code) => BY_CODE.has(code)

export const langMeta = (code) => BY_CODE.get(code) ?? BY_CODE.get(DEFAULT_LANG)

/** Which `_ar` / `_en` database column this language reads its records from. */
export const contentLangOf = (code) => langMeta(code).content

/**
 * True when this language writes its own database records rather than borrowing English ones.
 * Only `ar` and `en` do, and the content overlay in mergeContent turns on exactly for those.
 */
export const ownsContent = (code) => contentLangOf(code) === code
