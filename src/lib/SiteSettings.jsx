import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

// Shown until /api/settings answers — and kept if the API is unreachable.
export const DEFAULT_SETTINGS = {
  email: 'info@ngptechworld.com',
  phone: '+963 933 069 105',
  facebook: null,
  instagram: null,
  linkedin: null,
  x: null,
  whatsapp: null,
  // { key: bool } set from the dashboard; a key that is missing (or not loaded yet) counts as shown
  sections: {},
}

// Order the social buttons appear in.
export const SOCIAL_KEYS = ['facebook', 'instagram', 'linkedin', 'x', 'whatsapp']

const SiteSettingsContext = createContext({ ...DEFAULT_SETTINGS, loaded: true })

/** Loads the dashboard-managed contact details, social links and visible sections once for the whole site. */
export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS, loaded: false })

  useEffect(() => {
    let alive = true
    api.getSettings()
      .then((data) => { if (alive) setSettings({ ...DEFAULT_SETTINGS, ...data, loaded: true }) })
      .catch(() => { if (alive) setSettings((s) => ({ ...s, loaded: true })) })
    return () => { alive = false }
  }, [])

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
}

export const useSiteSettings = () => useContext(SiteSettingsContext)

/** `shown('testimonials')` → false only when the dashboard switched that section / page off. */
export function useSections() {
  const { sections } = useSiteSettings()
  return (key) => sections?.[key] !== false
}

/** Route wrapper for a page the dashboard can hide (`section` = e.g. 'team'): hidden → the 404 page. */
export function SectionGate({ section, fallback, children }) {
  const { loaded } = useSiteSettings()
  const shown = useSections()
  // Wait for the settings so a hidden page is never flashed before it turns into a 404.
  if (!loaded) return <div style={{ minHeight: '60vh' }} />
  return shown(section) ? children : fallback
}
