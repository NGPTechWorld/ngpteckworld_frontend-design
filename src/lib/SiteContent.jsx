import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

// null = nothing loaded (yet, or the API is unreachable): the site keeps its built-in texts.
const SiteContentContext = createContext(null)

/**
 * Loads the dashboard-managed page content (`GET /api/content`) once for the whole site.
 * Exposes the raw `{ texts, collections }` payload — `LanguageProvider` merges it over `ui.js`.
 * Any failure is swallowed on purpose: the site must look exactly as it does without the API.
 */
export function ContentProvider({ children }) {
  const [content, setContent] = useState(null)

  useEffect(() => {
    let alive = true
    api.getContent()
      .then((data) => { if (alive && data && typeof data === 'object') setContent(data) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>
}

/** The raw content payload, or `null`. Safe to call without a `ContentProvider`. */
export const useContent = () => useContext(SiteContentContext)
