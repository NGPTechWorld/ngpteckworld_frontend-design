import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { LanguageProvider } from '../i18n/LanguageContext'
import { SiteSettingsProvider, DEFAULT_SETTINGS } from '../lib/SiteSettings'
import { ui } from '../i18n/ui'
import { api } from '../lib/api'
import Contact from './Contact'

vi.mock('../lib/api', () => ({ api: { postContact: vi.fn(), getSettings: vi.fn() } }))

const t = ui.ar
const settings = { ...DEFAULT_SETTINGS, email: 'hello@example.com', phone: '+1 555 0100' }

const renderContact = () =>
  render(
    <LanguageProvider>
      <SiteSettingsProvider>
        <Contact />
      </SiteSettingsProvider>
    </LanguageProvider>,
  )

function fillAndSubmit() {
  fireEvent.change(screen.getByPlaceholderText(t.fName), { target: { value: 'Ali' } })
  fireEvent.change(screen.getByPlaceholderText(t.fPhone), { target: { value: '+963 900 000 000' } })
  fireEvent.change(screen.getByPlaceholderText(t.fEmail), { target: { value: 'ali@example.com' } })
  fireEvent.change(screen.getByPlaceholderText(t.fMsg), { target: { value: 'Hello there, I need an app' } })
  fireEvent.click(screen.getByRole('button', { name: t.submit }))
}

const httpError = (status) => Object.assign(new Error(`API ${status}`), { status })

beforeEach(() => {
  api.getSettings.mockReset().mockResolvedValue(settings)
  api.postContact.mockReset()
})

describe('sending the form', () => {
  test('shows a confirmation and clears the form on success', async () => {
    api.postContact.mockResolvedValue({ message: 'received' })
    renderContact()
    fillAndSubmit()
    expect(await screen.findByRole('button', { name: t.sent })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByPlaceholderText(t.fName)).toHaveValue('')
  })

  test('explains a validation error (422) and keeps what was typed', async () => {
    api.postContact.mockRejectedValue(httpError(422))
    renderContact()
    fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent(t.errValidation)
    expect(screen.getByPlaceholderText(t.fName)).toHaveValue('Ali')
  })

  test('explains the rate limit (429)', async () => {
    api.postContact.mockRejectedValue(httpError(429))
    renderContact()
    fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent(t.errThrottle)
  })

  test('shows a generic error when the server cannot be reached', async () => {
    api.postContact.mockRejectedValue(new TypeError('Failed to fetch'))
    renderContact()
    fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent(t.errGeneric)
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
