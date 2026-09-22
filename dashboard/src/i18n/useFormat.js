import { useMemo } from 'react'
import { formatBytes, formatDate, formatDateTime, formatNumber, formatRelative } from '@/lib/format'
import { useLanguage } from './LanguageContext'

/** const f = useFormat(); f.date(row.created_at), f.dateTime(x), f.number(1234), f.relative(x), f.bytes(n) */
export function useFormat() {
  const { lang } = useLanguage()
  return useMemo(
    () => ({
      number: (value, options) => formatNumber(value, lang, options),
      date: (value, options) => formatDate(value, lang, options),
      dateTime: (value) => formatDateTime(value, lang),
      relative: (value) => formatRelative(value, lang),
      bytes: (value) => formatBytes(value, lang),
    }),
    [lang],
  )
}
