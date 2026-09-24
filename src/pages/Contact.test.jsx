import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageContext'
import { SiteSettingsProvider, DEFAULT_SETTINGS } from '../lib/SiteSettings'
import { ui } from '../i18n/ui'
import { api } from '../lib/api'
import Contact from './Contact'

vi.mock('../lib/api', () => ({ api: { postContact: vi.fn(), getSettings: vi.fn(), getServices: vi.fn() } }))

const t = ui.ar
const settings = { ...DEFAULT_SETTINGS, email: 'hello@example.com', phone: '+1 555 0100' }
const services = [{ id: 1, title_ar: 'تصميم مواقع', title_en: 'Web design' }]

const renderContact = () =>
  render(
    <LanguageProvider>
      <SiteSettingsProvider>
        <Contact />
      </SiteSettingsProvider>
    </LanguageProvider>,
  )

async function selectService(label = 'تصميم مواقع') {
  fireEvent.click(screen.getByRole('button', { name: t.fService }))
  fireEvent.click(await screen.findByRole('option', { name: label }))
}

async function fillAndSubmit() {
  await selectService()
  fireEvent.change(screen.getByPlaceholderText(t.fName), { target: { value: 'Ali' } })
  fireEvent.change(screen.getByPlaceholderText(t.fPhone), { target: { value: '+963 900 000 000' } })
  fireEvent.change(screen.getByPlaceholderText(t.fEmail), { target: { value: 'ali@example.com' } })
  fireEvent.change(screen.getByPlaceholderText(t.fTitle), { target: { value: 'App request' } })
  fireEvent.change(screen.getByPlaceholderText(t.fDescription), { target: { value: 'Hello there, I need an app' } })
  fireEvent.click(screen.getByRole('button', { name: t.submit }))
}

const httpError = (status, body) => Object.assign(new Error(`API ${status}`), { status, body })

beforeEach(() => {
  localStorage.clear() // SiteSettings caches the last answer; every test starts as a first visit
  api.getSettings.mockReset().mockResolvedValue(settings)
  api.getServices.mockReset().mockResolvedValue(services)
  api.postContact.mockReset()
})

describe('sending the form', () => {
  test('sends the chosen service, title and description alongside the contact details', async () => {
    api.postContact.mockResolvedValue({ message: 'received' })
    renderContact()
    await fillAndSubmit()
    expect(await screen.findByRole('button', { name: t.sent })).toBeInTheDocument()
    expect(api.postContact).toHaveBeenCalledWith({
      service_id: '1', name: 'Ali', phone: '+963 900 000 000', email: 'ali@example.com',
      title: 'App request', description: 'Hello there, I need an app',
    })
  })

  test('shows a confirmation and clears the form on success', async () => {
    api.postContact.mockResolvedValue({ message: 'received' })
    renderContact()
    await fillAndSubmit()
    expect(await screen.findByRole('button', { name: t.sent })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByPlaceholderText(t.fName)).toHaveValue('')
  })

  test('explains a validation error (422 with no field detail) and keeps what was typed', async () => {
    api.postContact.mockRejectedValue(httpError(422))
    renderContact()
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent(t.errValidation)
    expect(screen.getByPlaceholderText(t.fName)).toHaveValue('Ali')
  })

  test('maps a 422 with field details to the matching field, below the input', async () => {
    api.postContact.mockRejectedValue(httpError(422, { errors: { service_id: ['The selected service is invalid.'] } }))
    renderContact()
    await fillAndSubmit()
    expect(await screen.findByText('The selected service is invalid.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull() // no generic banner when a field error covers it
  })

  test('explains the rate limit (429)', async () => {
    api.postContact.mockRejectedValue(httpError(429))
    renderContact()
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent(t.errThrottle)
  })

  test('shows a generic error when the server cannot be reached', async () => {
    api.postContact.mockRejectedValue(new TypeError('Failed to fetch'))
    renderContact()
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent(t.errGeneric)
  })

  test('cannot send again for a minute after a successful submit, even by forcing the form', async () => {
    api.postContact.mockResolvedValue({ message: 'received' })
    const { container } = renderContact()
    await fillAndSubmit()
    const button = await screen.findByRole('button', { name: t.sent })
    expect(button).toBeDisabled()

    fireEvent.submit(container.querySelector('form'))

    expect(api.postContact).toHaveBeenCalledTimes(1)
  })
})

describe('client-side validation', () => {
  test('requires every field and shows each error below its own input, without calling the API', async () => {
    renderContact()

    fireEvent.click(screen.getByRole('button', { name: t.submit }))

    expect(await screen.findAllByText(t.errRequired)).toHaveLength(6)
    expect(api.postContact).not.toHaveBeenCalled()
  })

  test('rejects a phone number that is not a number, with the error under the phone field', async () => {
    renderContact()
    await selectService()
    fireEvent.change(screen.getByPlaceholderText(t.fName), { target: { value: 'Ali' } })
    fireEvent.change(screen.getByPlaceholderText(t.fPhone), { target: { value: 'not a phone number' } })
    fireEvent.change(screen.getByPlaceholderText(t.fEmail), { target: { value: 'ali@example.com' } })
    fireEvent.change(screen.getByPlaceholderText(t.fTitle), { target: { value: 'App request' } })
    fireEvent.change(screen.getByPlaceholderText(t.fDescription), { target: { value: 'Hello there, I need an app' } })

    fireEvent.click(screen.getByRole('button', { name: t.submit }))

    const phoneError = await screen.findByText(t.errPhoneInvalid)
    expect(phoneError.id).toBe('phone-error')
    expect(screen.getByPlaceholderText(t.fPhone)).toHaveAttribute('aria-describedby', 'phone-error')
    expect(api.postContact).not.toHaveBeenCalled()
  })

  test('accepts a phone number with spaces, plus sign and parentheses', async () => {
    api.postContact.mockResolvedValue({ message: 'received' })
    renderContact()
    await selectService()
    fireEvent.change(screen.getByPlaceholderText(t.fName), { target: { value: 'Ali' } })
    fireEvent.change(screen.getByPlaceholderText(t.fPhone), { target: { value: '+963 (933) 069-105' } })
    fireEvent.change(screen.getByPlaceholderText(t.fEmail), { target: { value: 'ali@example.com' } })
    fireEvent.change(screen.getByPlaceholderText(t.fTitle), { target: { value: 'App request' } })
    fireEvent.change(screen.getByPlaceholderText(t.fDescription), { target: { value: 'Hello there, I need an app' } })

    fireEvent.click(screen.getByRole('button', { name: t.submit }))

    expect(await screen.findByRole('button', { name: t.sent })).toBeInTheDocument()
    expect(screen.queryByText(t.errPhoneInvalid)).toBeNull()
  })

  test('clears a field error as soon as it is edited', async () => {
    renderContact()
    fireEvent.click(screen.getByRole('button', { name: t.submit }))
    await screen.findAllByText(t.errRequired)

    fireEvent.change(screen.getByPlaceholderText(t.fName), { target: { value: 'A' } })

    expect(screen.getByPlaceholderText(t.fName)).not.toHaveAttribute('aria-invalid')
  })
})

describe('contact details from the dashboard', () => {
  test('shows the email, phone and only the social links that are filled in', async () => {
    api.getSettings.mockResolvedValue({ ...settings, facebook: 'https://facebook.com/ngp' })
    renderContact()
    expect(await screen.findByText('hello@example.com')).toBeInTheDocument()
    expect(screen.getByText('+1 555 0100')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: t.socialMeta.facebook })).toHaveAttribute('href', 'https://facebook.com/ngp')
    expect(screen.queryByText(t.socialMeta.instagram)).toBeNull()
  })

  test('hides the follow-us card when no social link is set', async () => {
    renderContact()
    await screen.findByText('hello@example.com')
    expect(screen.queryByText(t.cFollow)).toBeNull()
  })

  test('ignores a social link that is not an http(s) URL', async () => {
    api.getSettings.mockResolvedValue({ ...settings, x: 'javascript:alert(1)' })
    renderContact()
    await screen.findByText('hello@example.com')
    expect(screen.queryByText(t.socialMeta.x)).toBeNull()
  })

  test('falls back to the default contact details when the API is unreachable', () => {
    api.getSettings.mockRejectedValue(new Error('down'))
    renderContact()
    expect(screen.getByText(DEFAULT_SETTINGS.email)).toBeInTheDocument()
    expect(screen.getByText(DEFAULT_SETTINGS.phone)).toBeInTheDocument()
  })
})

describe('service picker', () => {
  test('lists every service, labeled in the current language, styled like the rest of the site', async () => {
    renderContact()
    fireEvent.click(await screen.findByRole('button', { name: t.fService }))
    expect(await screen.findByRole('option', { name: 'تصميم مواقع' })).toBeInTheDocument()
  })

  test('still renders the form when the services list cannot be loaded', async () => {
    api.getServices.mockRejectedValue(new Error('down'))
    renderContact()
    expect(await screen.findByPlaceholderText(t.fName)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t.fService })).toBeInTheDocument()
  })
})
