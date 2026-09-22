import { Handshake } from 'lucide-react'
import PartnerCreate from './PartnerCreate'
import PartnerEdit from './PartnerEdit'
import PartnerList from './PartnerList'

// The feature contract (docs/PLAN.md §7.1): auto-discovered by src/app/features.js — no registration needed.
export default {
  id: 'partners',
  nav: { order: 70, group: 'content', icon: Handshake, label: { ar: 'الشركاء', en: 'Partners' }, to: '/partners' },
  routes: [
    { path: 'partners', element: <PartnerList /> },
    { path: 'partners/new', element: <PartnerCreate /> },
    { path: 'partners/:id', element: <PartnerEdit /> },
  ],
}
