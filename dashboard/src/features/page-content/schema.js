import { z } from 'zod'
import { emptyToNull, optionalText, requiredText } from '@/lib/validation'

export const LANGS = ['ar', 'en']
export const MAX_TEXT_LENGTH = 2000
export const VALUE_ICON_KEYS = ['quality', 'innovation', 'commit', 'transparency']

/** Characters as the API counts them (PHP `max:2000`): an emoji is one, although JS `.length` says two. */
export const charCount = (value) => Array.from(value ?? '').length

export const allItems = (groups) => groups.flatMap((group) => group.items)

// ---------------------------------------------------------------------------------------------------------------
// Texts (one form for every group; the field names are `texts.<key>.<ar|en>`)
// ---------------------------------------------------------------------------------------------------------------

/** API groups → form values. `null` (never set / cleared) is an empty input. */
export function toTextsFormValues(groups) {
  const texts = {}
  for (const item of allItems(groups)) texts[item.key] = { ar: item.value_ar ?? '', en: item.value_en ?? '' }
  return { texts }
}

/** Mirrors the API rule (≤ 2000 characters per value, counted after Laravel trims it); everything else is free text and may be empty. */
export function makeTextsSchema(c, groups) {
  const value = z.string().refine((text) => charCount(text.trim()) <= MAX_TEXT_LENGTH, { error: c.maxLength(MAX_TEXT_LENGTH) })
  const shape = Object.fromEntries(allItems(groups).map((item) => [item.key, z.object({ ar: value, en: value })]))
  return z.object({ texts: z.object(shape) })
}

/** Surrounding spaces are noise; an empty value is sent as `null` = "use the website's built-in text". */
export const normalizeText = (value) => {
  const text = String(value ?? '').trim()
  return text === '' ? null : text
}

/**
 * The body of `PUT /content/texts`: ONLY the keys and languages whose field is dirty (the API touches just what it
 * receives), in the order of the page. `[{ key: 'heroBadge', value_en: 'New' }]`.
 */
export function buildTextsPayload(values, dirtyFields, groups) {
  const dirty = dirtyFields?.texts ?? {}
  const items = []
  for (const { key } of allItems(groups)) {
    const flags = dirty[key]
    if (!flags) continue
    const entry = { key }
    for (const lang of LANGS) if (flags[lang]) entry[`value_${lang}`] = normalizeText(values.texts?.[key]?.[lang])
    if (Object.keys(entry).length > 1) items.push(entry)
  }
  return items
}

/** How many texts (keys) have an unsaved edit; editing both languages of one text counts once. */
export const countDirtyItems = (dirtyFields, keys) => {
  const dirty = dirtyFields?.texts ?? {}
  return (keys ?? Object.keys(dirty)).filter((key) => dirty[key]?.ar || dirty[key]?.en).length
}

/**
 * Laravel names an invalid value by its position in what we sent (`items.2.value_en`); map that back to the form field
 * (`texts.<key>.en`). Errors that are not about a value (`items`, `items.0.key`) are left out — the caller shows them generally.
 */
export function textsServerErrors(err, sentItems) {
  const found = []
  for (const [field, messages] of Object.entries(err?.errors ?? {})) {
    const match = /^items\.(\d+)\.value_(ar|en)$/.exec(field)
    const key = match ? sentItems[Number(match[1])]?.key : undefined
    if (!key) continue
    found.push({ key, name: `texts.${key}.${match[2]}`, message: Array.isArray(messages) ? messages[0] : String(messages) })
  }
  return found
}

// ---------------------------------------------------------------------------------------------------------------
// Collection items (process steps, values, why-us) — the add / edit modal
// ---------------------------------------------------------------------------------------------------------------

/** Values have a title and an icon (no body); the other collections have a title and an optional body and no icon. */
export const hasBody = (collection) => collection !== 'values'

export function makeItemSchema(c, collection) {
  const shape = {
    title_ar: requiredText(c, 255),
    title_en: requiredText(c, 255),
    is_active: z.boolean(),
  }
  if (hasBody(collection)) {
    shape.body_ar = optionalText(c, MAX_TEXT_LENGTH)
    shape.body_en = optionalText(c, MAX_TEXT_LENGTH)
  } else {
    shape.icon_key = z.enum(VALUE_ICON_KEYS, { error: c.required })
  }
  return z.object(shape)
}

/** Form values of the modal: an empty form for a new item, the record's fields for an edit. */
export function toItemFormValues(collection, item) {
  const values = { title_ar: item?.title_ar ?? '', title_en: item?.title_en ?? '', is_active: item ? Boolean(item.is_active) : true }
  if (hasBody(collection)) {
    values.body_ar = item?.body_ar ?? ''
    values.body_en = item?.body_en ?? ''
  } else {
    // a value saved without an icon renders the "quality" icon on the site, so that is what the select shows
    values.icon_key = VALUE_ICON_KEYS.includes(item?.icon_key) ? item.icon_key : VALUE_ICON_KEYS[0]
  }
  return values
}

/** POST body (with `collection`) or PUT body (the collection cannot change). Only the fields of that collection are sent. */
export function toItemPayload(collection, values, { isEdit = false } = {}) {
  const data = { title_ar: values.title_ar, title_en: values.title_en, is_active: values.is_active }
  if (hasBody(collection)) {
    data.body_ar = emptyToNull(values.body_ar)
    data.body_en = emptyToNull(values.body_en)
  } else {
    data.icon_key = values.icon_key
  }
  return isEdit ? data : { collection, ...data }
}
