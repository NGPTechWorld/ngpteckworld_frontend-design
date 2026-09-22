import { ChartColumn } from 'lucide-react'
import StatCreate from './StatCreate'
import StatEdit from './StatEdit'
import StatList from './StatList'

// The feature contract (docs/PLAN.md §7.1): auto-discovered by src/app/features.js — no registration needed.
export default {
  id: 'stats',
  nav: { order: 50, group: 'content', icon: ChartColumn, label: { ar: 'الإحصائيات', en: 'Stats' }, to: '/stats' },
  routes: [
    { path: 'stats', element: <StatList /> },
    { path: 'stats/new', element: <StatCreate /> },
    { path: 'stats/:id', element: <StatEdit /> },
  ],
}
