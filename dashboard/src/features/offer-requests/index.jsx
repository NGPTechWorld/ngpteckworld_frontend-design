import { ShoppingBag } from 'lucide-react'
import OfferRequestDetail from './OfferRequestDetail'
import OfferRequestList from './OfferRequestList'

// Bookings and inquiries sent from the offers' pages — a separate inbox from the contact-form "Requests".
const label = { ar: 'طلبات العروض', en: 'Offer requests' }

export default {
  id: 'offer-requests',
  nav: { order: 25, group: 'main', icon: ShoppingBag, label, to: '/offer-requests' },
  routes: [
    { path: 'offer-requests', element: <OfferRequestList /> },
    { path: 'offer-requests/:id', element: <OfferRequestDetail /> },
  ],
}
