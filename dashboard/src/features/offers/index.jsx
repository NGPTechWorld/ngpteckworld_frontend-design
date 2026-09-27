import { Gift } from 'lucide-react'
import OfferCreate from './OfferCreate'
import OfferEdit from './OfferEdit'
import OfferList from './OfferList'

const label = { ar: 'العروض', en: 'Offers' }

export default {
  id: 'offers',
  nav: { order: 42, group: 'content', icon: Gift, label, to: '/offers' },
  routes: [
    { path: 'offers', element: <OfferList /> },
    { path: 'offers/new', element: <OfferCreate /> },
    { path: 'offers/:id', element: <OfferEdit /> },
  ],
}
