import { LayoutDashboard } from 'lucide-react'
import DashboardPage from './DashboardPage'

// The dashboard home is the index route (`/`) of the app layout (docs/PLAN.md §7.1).
const label = { ar: 'لوحة التحكم', en: 'Dashboard' }

export default {
  id: 'dashboard',
  nav: { order: 10, group: 'main', icon: LayoutDashboard, label, to: '/' },
  routes: [{ index: true, element: <DashboardPage /> }],
}
