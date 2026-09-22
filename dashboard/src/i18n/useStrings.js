import { useMemo } from 'react'
import { useLanguage } from './LanguageContext'
import common from './common'

/**
 * `const t = useStrings(strings)` where strings = { ar: {…}, en: {…} } → the table for the current language.
 * Keys missing in one language fall back to the other, so a forgotten translation never renders `undefined`.
 * The merge is shallow: give nested objects (e.g. `statusLabels`) in both languages.
 */
export function useStrings(strings) {
  const { lang } = useLanguage()
  return useMemo(() => {
    const other = lang === 'ar' ? 'en' : 'ar'
    return { ...(strings[other] || {}), ...(strings[lang] || {}) }
  }, [strings, lang])
}

/** Shared strings (save, cancel, validation messages, errors…). */
export const useCommon = () => useStrings(common)
