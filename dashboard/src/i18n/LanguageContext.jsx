import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react'
import { LANG_KEY, storage } from '@/lib/storage'

const isLang = (value) => value === 'ar' || value === 'en'

const isBilingualObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && ('ar' in value || 'en' in value)

function makeHelpers(lang) {
  /** pick(arValue, enValue) or pick({ ar, en }) → the value for the current language (falls back to the other). */
  const pick = (ar, en) => {
    if (en === undefined && isBilingualObject(ar)) return ar[lang] ?? ar[lang === 'ar' ? 'en' : 'ar']
    return lang === 'ar' ? (ar ?? en) : (en ?? ar)
  }
  /** pickField(record, 'question') → record.question_ar / record.question_en with fallback to the other one. */
  const pickField = (record, base) => {
    if (!record) return ''
    const primary = record[`${base}_${lang}`]
    if (primary !== null && primary !== undefined && primary !== '') return primary
    return record[`${base}_${lang === 'ar' ? 'en' : 'ar'}`] ?? ''
  }
  return { pick, pickField }
}

const defaultValue = {
  lang: 'ar',
  isAr: true,
  dir: 'rtl',
  setLang() {},
  toggle() {},
  ...makeHelpers('ar'),
}

const LanguageContext = createContext(defaultValue)

/**
 * Arabic (RTL) is the default. The choice is stored in localStorage and mirrored on <html lang dir>.
 * `initialLang` skips the stored value (tests).
 */
export function LanguageProvider({ children, initialLang }) {
  const [lang, setLangState] = useState(() => {
    if (isLang(initialLang)) return initialLang
    const stored = storage.get(LANG_KEY)
    return isLang(stored) ? stored : 'ar'
  })

  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useLayoutEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = useCallback((next) => {
    if (!isLang(next)) return
    setLangState(next)
    storage.set(LANG_KEY, next)
  }, [])

  const toggle = useCallback(() => setLang(lang === 'ar' ? 'en' : 'ar'), [lang, setLang])

  const value = useMemo(
    () => ({ lang, isAr: lang === 'ar', dir, setLang, toggle, ...makeHelpers(lang) }),
    [lang, dir, setLang, toggle],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
