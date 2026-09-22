import { HelpCircle } from 'lucide-react'
import FaqCreate from './FaqCreate'
import FaqEdit from './FaqEdit'
import FaqList from './FaqList'

// The feature contract (docs/PLAN.md §7.1): auto-discovered by src/app/features.js — no registration needed.
export default {
  id: 'faqs',
  nav: { order: 80, group: 'content', icon: HelpCircle, label: { ar: 'الأسئلة الشائعة', en: 'FAQ' }, to: '/faqs' },
  routes: [
    { path: 'faqs', element: <FaqList /> },
    { path: 'faqs/new', element: <FaqCreate /> },
    { path: 'faqs/:id', element: <FaqEdit /> },
  ],
}
