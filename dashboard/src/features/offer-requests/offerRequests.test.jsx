import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, paginated } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import feature from './index'
import OfferRequestDetail from './OfferRequestDetail'
import OfferRequestList from './OfferRequestList'
import { daysUntil, expiryOf, today } from './subscription'

const make = (id, over = {}) => ({
  id, type: 'booking',
  offer: { id: 3, slug: 'accounting', title_ar: 'تطبيق محاسبة', title_en: 'Accounting app' },
  offer_title: 'تطبيق محاسبة', plan: 'Monthly',
  name: `Client ${id}`, phone: '+963 933 000 111', email: null, message: null,
  status: 'new', admin_notes: null, created_at: '2026-09-27T10:00:00Z', updated_at: '2026-09-27T10:00:00Z',
  ...over,
})

describe('offer-requests feature contract', () => {
  it('is a separate inbox from the contact requests', () => {
    expect(feature.id).toBe('offer-requests')
    expect(feature.nav).toMatchObject({ group: 'main', to: '/offer-requests', label: { ar: 'طلبات العروض', en: 'Offer requests' } })
  })
})

describe('OfferRequestList', () => {
  it('shows type, offer and plan, filters by type and changes a status in place', async () => {
    const server = mockApi({
      'GET /offer-requests': () => paginated([make(1), make(2, { type: 'inquiry', offer: null, plan: null, status: 'done' })]),
      'PUT /offer-requests/:id': ({ params, body }) => ({ data: { ...make(Number(params.id)), ...body } }),
    })
    const { user } = renderWithProviders(<OfferRequestList />, { route: '/offer-requests' })

    const first = (await screen.findByText('Client 1')).closest('tr')
    expect(within(first).getByText('Booking')).toBeInTheDocument()
    expect(within(first).getByText('Accounting app')).toBeInTheDocument()
    expect(within(first).getByText('Monthly')).toBeInTheDocument()
    const second = screen.getByText('Client 2').closest('tr')
    expect(within(second).getByText('Inquiry')).toBeInTheDocument()
    expect(within(second).getByText('تطبيق محاسبة')).toBeInTheDocument() // deleted offer → the stored title

    await user.selectOptions(within(first).getByRole('combobox', { name: 'Status of Client 1' }), 'in_progress')
    await waitFor(() => expect(server.calls('PUT', '/offer-requests/1')).toHaveLength(1))
    expect(server.calls('PUT', '/offer-requests/1')[0].body).toEqual({ status: 'in_progress' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Request type' }), 'inquiry')
    await waitFor(() => expect(server.calls('GET', '/offer-requests').at(-1).query.type).toBe('inquiry'))
  })
})

describe('OfferRequestDetail', () => {
  it('shows the question, the contact links and saves internal notes', async () => {
    const server = mockApi({
      'GET /offer-requests/:id': () => ({ data: make(5, { type: 'inquiry', message: 'Is there a free trial?', email: 'c@example.com' }) }),
      'PUT /offer-requests/:id': ({ body }) => ({ data: { ...make(5), ...body } }),
    })
    const { user } = renderWithProviders(<OfferRequestDetail />, { route: '/offer-requests/5', path: '/offer-requests/:id' })

    expect(await screen.findByText('Is there a free trial?')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Question' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/963933000111')
    expect(screen.getByRole('link', { name: /c@example.com/ })).toHaveAttribute('href', 'mailto:c@example.com')

    await user.type(screen.getByLabelText('Internal notes'), 'Sent the price list')
    await user.click(screen.getByRole('button', { name: 'Save notes' }))

    await waitFor(() => expect(server.calls('PUT', '/offer-requests/5')).toHaveLength(1))
    expect(server.calls('PUT', '/offer-requests/5')[0].body).toEqual({ admin_notes: 'Sent the price list' })
  })

  it('accepts the request today with the plan length and shows when it ends', async () => {
    const server = mockApi({
      'GET /offer-requests/:id': () => ({ data: make(6, { duration_days: 30, accepted_at: null, expires_at: null }) }),
      'PUT /offer-requests/:id': ({ body }) => ({ data: { ...make(6), ...body, expires_at: expiryOf(body.accepted_at, body.duration_days) } }),
    })
    const { user } = renderWithProviders(<OfferRequestDetail />, { route: '/offer-requests/6', path: '/offer-requests/:id' })

    expect(await screen.findByLabelText('Subscription length')).toHaveValue(30)
    await user.click(screen.getByRole('button', { name: 'One day more' }))
    expect(screen.getByLabelText('Subscription length')).toHaveValue(31)

    await user.click(screen.getByRole('button', { name: 'Accept today' }))

    await waitFor(() => expect(server.calls('PUT', '/offer-requests/6')).toHaveLength(1))
    expect(server.calls('PUT', '/offer-requests/6')[0].body).toEqual({ duration_days: 31, accepted_at: today() })
    expect(await screen.findByText('31 days left')).toBeInTheDocument()
  })
})

describe('subscription dates', () => {
  it('counts the end date from the acceptance day and the days left to it', () => {
    expect(expiryOf('2026-09-27', 30)).toBe('2026-10-27')
    expect(expiryOf('2026-12-15', 30)).toBe('2027-01-14')
    expect(expiryOf('', 30)).toBeNull()
    expect(expiryOf('2026-09-27', '')).toBeNull()
    expect(daysUntil('2026-10-27', '2026-09-27')).toBe(30)
    expect(daysUntil('2026-09-20', '2026-09-27')).toBe(-7)
    expect(today(new Date(2026, 8, 7))).toBe('2026-09-07')
  })
})
