import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useContent } from '../lib/SiteContent'
import { mergeContent } from '../lib/mergeContent'
import { DEFAULT_LANG, LANGUAGES, isLang, langMeta } from './languages'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'ngp.lang'

/**
 * Which languages a first-time visitor may be sent to on the strength of their browser alone.
 *
 * English is deliberately absent. An English-locale browser is ordinary among this company's own
 * Arabic-speaking audience — plenty of people in Damascus run their phone in English — so treating
 * it as a request for the English site would pull the primary audience out of its own language.
 * The eight European locales carry no such ambiguity: nobody's browser reports Dutch by accident.
 *
 * Arabic stays the default for everyone else, and one click on the language menu overrides all of
 * this permanently.
 */
const AUTO_DETECT = new Set(['de', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr'])

function readStored() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isLang(saved) ? saved : null
  } catch {
    // Private windows and blocked site data throw on access rather than returning null.
    return null
  }
}

function detectFromBrowser() {
  try {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const base = String(tag ?? '').toLowerCase().split('-')[0]
      if (AUTO_DETECT.has(base)) return base
    }
  } catch {
    // No navigator, or a locked-down one.
  }
  return null
}

const initialLang = () => readStored() ?? detectFromBrowser() ?? DEFAULT_LANG

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)

  const meta = langMeta(lang)
  const dir = meta.dir
  // The language every database record is read in. Only Arabic and English have columns of their
  // own; the European locales all resolve to English here, which is what keeps their pages full
  // of content instead of full of blanks. See ./languages.js.
  const contentLang = meta.content

  const content = useContent()
  const t = useMemo(() => mergeContent(lang, content), [lang, content])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = useCallback((next) => {
    if (!isLang(next)) return
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Remembering the choice is a convenience; failing to is not worth breaking the switch over.
    }
  }, [])

  const pick = useCallback((obj, field) => obj?.[`${field}_${contentLang}`], [contentLang])

  const value = useMemo(
    () => ({ lang, dir, contentLang, isAr: lang === 'ar', t, setLang, pick, languages: LANGUAGES }),
    [lang, dir, contentLang, t, setLang, pick],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
