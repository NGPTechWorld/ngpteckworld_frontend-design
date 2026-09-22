import { Settings } from 'lucide-react'
import SettingsPage from './SettingsPage'

const label = { ar: 'إعدادات الموقع', en: 'Site settings' }

export default {
  id: 'settings',
  nav: { order: 100, group: 'system', icon: Settings, label, to: '/settings' },
  routes: [{ path: 'settings', element: <SettingsPage /> }],
}
