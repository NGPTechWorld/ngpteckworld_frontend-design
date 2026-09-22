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
}

// Order the social buttons appear in.
export const SOCIAL_KEYS = ['facebook', 'instagram', 'linkedin', 'x', 'whatsapp']

const SiteSettingsContext = createContext(DEFAULT_SETTINGS)

/** Loads the dashboard-managed contact details + social links once for the whole site. */
export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  useEffect(() => {
    let alive = true
    api.getSettings().then((data) => { if (alive && data) setSettings(data) }).catch(() => {})
    return () => { alive = false }
  }, [])

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
}

export const useSiteSettings = () => useContext(SiteSettingsContext)
