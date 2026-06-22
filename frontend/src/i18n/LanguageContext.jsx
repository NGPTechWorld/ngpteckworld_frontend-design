import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ui } from './ui'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('ar')
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const toggle = useCallback(() => setLang((l) => (l === 'ar' ? 'en' : 'ar')), [])
  const pick = useCallback((obj, field) => obj?.[`${field}_${lang}`], [lang])

  const value = { lang, dir, isAr: lang === 'ar', t: ui[lang], toggle, pick }
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
