// Latin digits in both languages: ids, ordering and dates then match what the database and the API show.
const localeFor = (lang) => (lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB')

const toDate = (value) => {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatNumber(value, lang = 'ar', options) {
  const number = Number(value)
  if (value === null || value === undefined || value === '' || !Number.isFinite(number)) return '—'
  return new Intl.NumberFormat(localeFor(lang), options).format(number)
}

export function formatDate(value, lang = 'ar', options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = toDate(value)
  return date ? new Intl.DateTimeFormat(localeFor(lang), options).format(date) : '—'
}

export function formatDateTime(value, lang = 'ar') {
  return formatDate(value, lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** "5 minutes ago" / "منذ 5 دقائق" (falls back to the date when older than 30 days). */
export function formatRelative(value, lang = 'ar', now = Date.now()) {
  const date = toDate(value)
  if (!date) return '—'
  const seconds = Math.round((date.getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  if (abs > 30 * 86400) return formatDate(date, lang)
  const rtf = new Intl.RelativeTimeFormat(localeFor(lang), { numeric: 'auto' })
  if (abs < 60) return rtf.format(seconds, 'second')
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour')
  return rtf.format(Math.round(seconds / 86400), 'day')
}

export function formatBytes(bytes, lang = 'ar') {
  if (!Number.isFinite(bytes)) return '—'
  if (bytes < 1024) return `${formatNumber(bytes, lang)} B`
  if (bytes < 1024 * 1024) return `${formatNumber(bytes / 1024, lang, { maximumFractionDigits: 1 })} KB`
  return `${formatNumber(bytes / 1024 / 1024, lang, { maximumFractionDigits: 1 })} MB`
}
