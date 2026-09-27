import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from '../i18n/LanguageContext'
import { ui } from '../i18n/ui'
import { api } from '../lib/api'
import OfferDetail from './OfferDetail'
import Offers from './Offers'

vi.mock('../lib/api', () => ({ api: { getOffers: vi.fn(), getOffer: vi.fn(), postOfferRequest: vi.fn() } }))

const t = ui.ar // the site starts in Arabic unless the visitor picked another language

const offer = {
  id: 1, slug: 'accounting',
  title_ar: 'تطبيق محاسبة', title_en: 'Accounting app',
  short_ar: 'محاسبة سهلة', short_en: 'Easy accounting',
  cover_image: 'https://api.test/media/offers/c.png',
  description_ar: 'شرح كامل', description_en: 'Full description',
  gallery: ['https://api.test/media/offers/g1.png'], video_url: null,
  features: [{ title_ar: 'فواتير', title_en: 'Invoices', description_ar: 'نقدي وآجل', description_en: null }],
  plans: [
    { name_ar: 'شهري', name_en: 'Monthly', price_ar: '20$', price_en: '$20', description_ar: null, description_en: null, highlighted: false },
    { name_ar: 'سنوي', name_en: 'Yearly', price_ar: '200$', price_en: '$200', description_ar: null, description_en: null, highlighted: true },
  ],
  plans_note_ar: 'يمكن الإلغاء في أي وقت', plans_note_en: null,
}

const renderAt = (path) =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/offers" element={<Offers />} />
          <Route path="/offers/:slug" element={<OfferDetail />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )

beforeEach(() => {
  localStorage.clear()
  api.getOffers.mockReset().mockResolvedValue([offer])
  api.getOffer.mockReset().mockResolvedValue(offer)
  api.postOfferRequest.mockReset().mockResolvedValue({ message: 'received' })
})

test('lists the offers as cards linking to their page', async () => {
  renderAt('/offers')

  const card = (await screen.findByText('تطبيق محاسبة')).closest('a')
  expect(card).toHaveAttribute('href', '/offers/accounting')
  expect(within(card).getByText('محاسبة سهلة')).toBeInTheDocument()
})

test('says so when there are no offers', async () => {
  api.getOffers.mockResolvedValue([])
  renderAt('/offers')

  expect(await screen.findByText(t.offersEmpty)).toBeInTheDocument()
})

test('shows the details: description, features, plans with the highlighted one and the plans note', async () => {
  renderAt('/offers/accounting')

  expect(await screen.findByRole('heading', { level: 1, name: 'تطبيق محاسبة' })).toBeInTheDocument()
  expect(screen.getByText('شرح كامل')).toBeInTheDocument()
  expect(screen.getByText('فواتير')).toBeInTheDocument()
  expect(screen.getByText('نقدي وآجل')).toBeInTheDocument()
  expect(screen.getByText('200$')).toBeInTheDocument()
  expect(screen.getByText(t.oPopular)).toBeInTheDocument()
  expect(screen.getByText('يمكن الإلغاء في أي وقت')).toBeInTheDocument()
})

test('books a chosen plan', async () => {
  renderAt('/offers/accounting')
  await screen.findByRole('heading', { level: 1 })

  fireEvent.click(screen.getAllByRole('button', { name: t.oBookPlan })[1])
  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getByLabelText(t.oPlanLabel)).toHaveValue('سنوي')

  fireEvent.change(within(dialog).getByLabelText(t.fName), { target: { value: 'سارة' } })
  fireEvent.change(within(dialog).getByLabelText(t.fPhone), { target: { value: '+963 933 000 111' } })
  fireEvent.change(within(dialog).getByLabelText(t.oNote), { target: { value: 'فرعين' } })
  fireEvent.click(within(dialog).getByRole('button', { name: t.submit }))

  await waitFor(() => expect(api.postOfferRequest).toHaveBeenCalledTimes(1))
  expect(api.postOfferRequest).toHaveBeenCalledWith('accounting', {
    type: 'booking', plan: 'سنوي', name: 'سارة', phone: '+963 933 000 111', email: null, message: 'فرعين',
  })
  expect(await within(dialog).findByText(t.oSentBooking)).toBeInTheDocument()
})

test('an inquiry needs a question and is sent without a plan', async () => {
  renderAt('/offers/accounting')
  await screen.findByRole('heading', { level: 1 })

  fireEvent.click(screen.getAllByRole('button', { name: t.oAsk })[0])
  const dialog = screen.getByRole('dialog')
  expect(within(dialog).queryByLabelText(t.oPlanLabel)).toBeNull()

  fireEvent.change(within(dialog).getByLabelText(t.fName), { target: { value: 'Sara' } })
  fireEvent.change(within(dialog).getByLabelText(t.fPhone), { target: { value: '0933000111' } })
  fireEvent.click(within(dialog).getByRole('button', { name: t.submit }))
  expect(await within(dialog).findByText(t.errRequired)).toBeInTheDocument()
  expect(api.postOfferRequest).not.toHaveBeenCalled()

  fireEvent.change(within(dialog).getByLabelText(t.oQuestion), { target: { value: 'هل يوجد تجربة مجانية؟' } })
  fireEvent.click(within(dialog).getByRole('button', { name: t.submit }))

  await waitFor(() => expect(api.postOfferRequest).toHaveBeenCalledTimes(1))
  expect(api.postOfferRequest.mock.calls[0][1]).toMatchObject({ type: 'inquiry', plan: null, message: 'هل يوجد تجربة مجانية؟' })
  expect(await within(dialog).findByText(t.oSentInquiry)).toBeInTheDocument()
})

test('shows the server field errors and keeps the form open', async () => {
  api.postOfferRequest.mockRejectedValue(Object.assign(new Error('API 422'), { status: 422, body: { errors: { phone: ['رقم غير صالح'] } } }))
  renderAt('/offers/accounting')
  await screen.findByRole('heading', { level: 1 })

  fireEvent.click(screen.getAllByRole('button', { name: t.oBook })[0])
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText(t.fName), { target: { value: 'Sara' } })
  fireEvent.change(within(dialog).getByLabelText(t.fPhone), { target: { value: '0933000111' } })
  fireEvent.click(within(dialog).getByRole('button', { name: t.submit }))

  expect(await within(dialog).findByText('رقم غير صالح')).toBeInTheDocument()
  expect(within(dialog).getByLabelText(t.fPhone)).toHaveAttribute('aria-invalid', 'true')
})

test('says the offer was not found', async () => {
  api.getOffer.mockRejectedValue(Object.assign(new Error('API 404'), { status: 404 }))
  renderAt('/offers/nope')

  expect(await screen.findByText(t.oNotFound)).toBeInTheDocument()
})
