import { Layers } from 'lucide-react'
import ServiceCreate from './ServiceCreate'
import ServiceEdit from './ServiceEdit'
import ServiceList from './ServiceList'

// The feature contract (docs/PLAN.md §7.1): auto-discovered by src/app/features.js — no registration needed.
export default {
  id: 'services',
  nav: { order: 40, group: 'content', icon: Layers, label: { ar: 'الخدمات', en: 'Services' }, to: '/services' },
  routes: [
    { path: 'services', element: <ServiceList /> },
    { path: 'services/new', element: <ServiceCreate /> },
    { path: 'services/:id', element: <ServiceEdit /> },
  ],
}
