import { ui } from '../i18n/ui'
import { iconPaths } from './visuals'

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)
const isObject = (v) => v !== null && typeof v === 'object'
const filled = (v) => typeof v === 'string' && v.trim() !== ''
const str = (v) => (typeof v === 'string' ? v : '')

// PHP encodes an empty array as [] and a filtered list as {"1":…,"2":…}: accept both shapes.
const asList = (v) => (Array.isArray(v) ? v : isObject(v) ? Object.values(v) : [])

// The About page looks the icon up by this key, so an unknown one would render an empty box.
const DEFAULT_VALUE_ICON = 'quality'
const iconKey = (v) => (typeof v === 'string' && has(iconPaths, v) ? v : DEFAULT_VALUE_ICON)

// API collection -> [dictionary key it replaces, API item -> dictionary item]
const COLLECTIONS = {
  process_steps: ['processSteps', (item, lang) => ({ t: item[`title_${lang}`], d: str(item[`body_${lang}`]) })],
  values: ['values', (item, lang) => ({ key: iconKey(item.icon_key), t: item[`title_${lang}`] })],
  why_us: ['whyus', (item, lang) => ({ t: item[`title_${lang}`], d: str(item[`body_${lang}`]) })],
}

/**
 * Overlays the dashboard-managed content (`GET /api/content` → `data`) on the built-in
 * dictionary for one language and returns the dictionary the site should render with.
 *
 * - `texts[key][lang]` replaces `ui[lang][key]` when it is a non-empty string and the key is a
 *   plain-text entry of the dictionary (unknown keys and list entries such as `stats` are ignored).
 * - `collections.process_steps | values | why_us` replace `processSteps | values | whyus`, but
 *   only when they hold at least one item that has a title in `lang`.
 * - Anything else — no content, a malformed payload — leaves the built-in text untouched.
 *
 * Pure: never mutates `ui` or `content`, never throws.
 */
export function mergeContent(lang, content) {
  const base = ui[lang] || ui.ar
  if (!isObject(content)) return base

  const merged = { ...base }

  const { texts, collections } = content
  if (isObject(texts)) {
    for (const key of Object.keys(texts)) {
      const value = isObject(texts[key]) ? texts[key][lang] : undefined
      if (has(base, key) && typeof base[key] === 'string' && filled(value)) merged[key] = value
    }
  }

  if (isObject(collections)) {
    for (const [name, [target, map]] of Object.entries(COLLECTIONS)) {
      const items = asList(collections[name])
        .filter((item) => isObject(item) && filled(item[`title_${lang}`]))
        .map((item) => map(item, lang))
      if (items.length) merged[target] = items
    }
  }

  return merged
}
