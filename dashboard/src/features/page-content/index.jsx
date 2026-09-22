import { PanelsTopLeft } from 'lucide-react'
import PageContent from './PageContent'

// The feature contract (docs/PLAN.md §7.1): auto-discovered by src/app/features.js — no registration needed.
const label = { ar: 'محتوى الصفحات', en: 'Page content' }

export default {
  id: 'page-content',
  nav: { order: 90, group: 'content', icon: PanelsTopLeft, label, to: '/page-content' },
  routes: [{ path: 'page-content', element: <PageContent /> }],
}
