import { IdCard } from 'lucide-react'
import TeamCreate from './TeamCreate'
import TeamEdit from './TeamEdit'
import TeamList from './TeamList'

// The feature contract (docs/PLAN.md §7.1): auto-discovered by src/app/features.js — no registration needed.
// Icon deliberately not `Users` — the `users` feature (admin accounts, system group) already owns that one.
export default {
  id: 'team',
  nav: { order: 75, group: 'content', icon: IdCard, label: { ar: 'فريقنا', en: 'Our Team' }, to: '/team' },
  routes: [
    { path: 'team', element: <TeamList /> },
    { path: 'team/new', element: <TeamCreate /> },
    { path: 'team/:id', element: <TeamEdit /> },
  ],
}
