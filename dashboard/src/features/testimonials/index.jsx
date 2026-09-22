import { MessageSquareQuote } from 'lucide-react'
import TestimonialCreate from './TestimonialCreate'
import TestimonialEdit from './TestimonialEdit'
import TestimonialList from './TestimonialList'

// The feature contract (docs/PLAN.md §7.1): auto-discovered by src/app/features.js — no registration needed.
export default {
  id: 'testimonials',
  nav: { order: 60, group: 'content', icon: MessageSquareQuote, label: { ar: 'آراء العملاء', en: 'Testimonials' }, to: '/testimonials' },
  routes: [
    { path: 'testimonials', element: <TestimonialList /> },
    { path: 'testimonials/new', element: <TestimonialCreate /> },
    { path: 'testimonials/:id', element: <TestimonialEdit /> },
  ],
}
