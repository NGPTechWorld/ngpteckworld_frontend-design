import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, paginated, reply } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import feature from './index'
import OfferCreate from './OfferCreate'
import OfferEdit from './OfferEdit'
import OfferList from './OfferList'

const offer = {
  id: 3, slug: 'accounting',
  title_ar: 'تطبيق محاسبة', title_en: 'Accounting app',
  short_ar: 'محاسبة سهلة', short_en: 'Easy accounting',
  description_ar: 'وصف', description_en: 'Description',
  cover_image: null, cover_image_url: null, gallery: [], gallery_urls: [], video_url: null,
  features: [{ title_ar: 'فواتير', title_en: 'Invoices', description_ar: null, description_en: null }],
  plans: [{ name_ar: 'شهري', name_en: 'Monthly', price_ar: null, price_en: '$20 / month', description_ar: null, description_en: null, highlighted: true }],
  plans_note_ar: null, plans_note_en: null,
  is_active: true, order: 1, created_at: '2026-09-27T10:00:00Z', updated_at: '2026-09-27T10:00:00Z',
}

describe('offers feature contract', () => {
  it('is its own section in the content group', () => {
    expect(feature.id).toBe('offers')
    expect(feature.nav).toMatchObject({ group: 'content', to: '/offers', label: { ar: 'العروض', en: 'Offers' } })
    expect(feature.routes.map((r) => r.path)).toEqual(['offers', 'offers/new', 'offers/:id'])
  })
})

describe('OfferList', () => {
  it('lists the offers with their plan count and hides one with the switch', async () => {
    const server = mockApi({
      'GET /offers': () => paginated([offer]),
      'PUT /offers/:id': ({ body }) => ({ data: { ...offer, ...body } }),
    })
    const { user } = renderWithProviders(<OfferList />, { route: '/offers' })

    const row = (await screen.findByText('Accounting app')).closest('tr')
    expect(within(row).getByText('Easy accounting')).toBeInTheDocument()
    await user.click(within(row).getByRole('switch', { name: 'Active: Accounting app' }))

    await waitFor(() => expect(server.calls('PUT', '/offers/3')).toHaveLength(1))
    expect(server.calls('PUT', '/offers/3')[0].body).toEqual({ is_active: false })
  })
})

describe('OfferCreate', () => {
  it('validates the card fields locally and sends nothing', async () => {
    const server = mockApi({})
    const { user } = renderWithProviders(<OfferCreate />, { route: '/offers/new' })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findAllByText('This field is required')).toHaveLength(6) // title, short, description × ar/en
    expect(server.requests).toHaveLength(0)
  })

  it('creates an offer with a feature and a highlighted plan', async () => {
    const server = mockApi({ 'POST /offers': ({ body }) => reply(201, { data: { id: 9, ...body } }) })
    const { user } = renderWithProviders(<OfferCreate />, { route: '/offers/new' })

    await user.type(screen.getByLabelText('Title (Arabic)'), 'خدمة سحابية')
    await user.type(screen.getByLabelText('Title (English)'), 'Cloud service')
    await user.type(screen.getByLabelText('Short description (Arabic)'), 'استضافة')
    await user.type(screen.getByLabelText('Short description (English)'), 'Hosting')
    await user.type(screen.getByLabelText('Full description (Arabic)'), 'شرح')
    await user.type(screen.getByLabelText('Full description (English)'), 'Details')

    await user.click(screen.getByRole('button', { name: 'Add feature' }))
    await user.type(screen.getByLabelText('Feature (Arabic)'), 'نسخ احتياطي')
    await user.type(screen.getByLabelText('Feature (English)'), 'Backups')

    await user.click(screen.getByRole('button', { name: 'Add plan' }))
    await user.type(screen.getByLabelText('Plan name (Arabic)'), 'سنوي')
    await user.type(screen.getByLabelText('Plan name (English)'), 'Yearly')
    await user.type(screen.getByLabelText('Price (English)'), '$200 / year')
    await user.click(screen.getByRole('switch', { name: /Highlighted plan/ }))

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/offers')).toHaveLength(1))
    const body = server.calls('POST', '/offers')[0].body
    expect(body).toMatchObject({ title_en: 'Cloud service', slug: null, video_url: null, gallery: [], is_active: true })
    expect(body.features).toEqual([{ title_ar: 'نسخ احتياطي', title_en: 'Backups', description_ar: null, description_en: null }])
    expect(body.plans).toEqual([{ name_ar: 'سنوي', name_en: 'Yearly', price_ar: null, price_en: '$200 / year', description_ar: null, description_en: null, highlighted: true }])
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/offers$/))
  })
})

describe('OfferEdit', () => {
  it('loads the offer with its features and plans and keeps Save disabled until a change', async () => {
    mockApi({ 'GET /offers/:id': () => ({ data: offer }) })
    const { user } = renderWithProviders(<OfferEdit />, { route: '/offers/3', path: '/offers/:id' })

    expect(await screen.findByLabelText('Title (English)')).toHaveValue('Accounting app')
    expect(screen.getByLabelText('Feature (English)')).toHaveValue('Invoices')
    expect(screen.getByLabelText('Price (English)')).toHaveValue('$20 / month')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Remove “Invoices”' }))
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })
})
