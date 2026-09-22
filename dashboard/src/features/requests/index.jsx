import { Inbox } from 'lucide-react'
import RequestDetail from './RequestDetail'
import RequestList from './RequestList'

// Requests come from the public contact form, so there is no "new" page: a list and a detail page.
const label = { ar: 'الطلبات', en: 'Requests' }

export default {
  id: 'requests',
  nav: { order: 20, group: 'main', icon: Inbox, label, to: '/requests' },
  routes: [
    { path: 'requests', element: <RequestList /> },
    { path: 'requests/:id', element: <RequestDetail /> },
  ],
}
