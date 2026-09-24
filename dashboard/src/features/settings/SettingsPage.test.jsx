import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import SettingsPage from './SettingsPage'

const settings = {
  email: 'info@ngptechworld.com',
  phone: '+963 933 069 105',
  facebook: 'https://facebook.com/ngp',
  instagram: null,
  linkedin: null,
  x: null,
  whatsapp: null,
}

/** Behaves like the API: a partial PUT merges into the stored row and answers with it. */
function settingsServer(extra = {}) {
  let stored = { ...settings }
  const server = mockApi({
    'GET /settings': () => ({ data: stored }),
    'PUT /settings': ({ body }) => {
      stored = { ...stored, ...body }
      return { data: stored }
    },
    ...extra,
  })
  return server
}
const field = (name) => screen.getByLabelText(name)
const save = () => screen.getByRole('button', { name: 'Save' })

describe('SettingsPage', () => {
  it('shows a spinner, then the form filled with the saved values', async () => {
    settingsServer()
    renderWithProviders(<SettingsPage />, { route: '/settings' })
    expect(screen.getByText('Loading…')).toBeInTheDocument()

    expect(await screen.findByLabelText('Email')).toHaveValue('info@ngptechworld.com')
    expect(field('Phone number')).toHaveValue('+963 933 069 105')
    expect(field('Facebook')).toHaveValue('https://facebook.com/ngp')
    for (const name of ['Instagram', 'LinkedIn', 'X (Twitter)', 'WhatsApp']) expect(field(name)).toHaveValue('')
    expect(screen.getByRole('heading', { level: 1, name: 'Site settings' })).toBeInTheDocument()
  })

  it('renders the contact fields and the links left-to-right', async () => {
    settingsServer()
    renderWithProviders(<SettingsPage />, { route: '/settings', lang: 'ar' })

    expect(await screen.findByLabelText('البريد الإلكتروني')).toHaveAttribute('dir', 'ltr')
    expect(field('رقم الهاتف')).toHaveAttribute('dir', 'ltr')
    expect(field('واتساب')).toHaveAttribute('dir', 'ltr')
    expect(screen.getByRole('heading', { level: 1, name: 'إعدادات الموقع' })).toBeInTheDocument()
  })

  it('explains that an empty social link hides its button, and gives examples such as the WhatsApp link', async () => {
    settingsServer()
    renderWithProviders(<SettingsPage />, { route: '/settings' })
    await screen.findByLabelText('Email')

    expect(screen.getByText(/An empty link hides that network’s button on the website/)).toBeInTheDocument()
    expect(screen.getByText('https://wa.me/963XXXXXXXXX')).toBeInTheDocument()
    expect(field('WhatsApp')).toHaveAttribute('placeholder', 'https://wa.me/963XXXXXXXXX')
    expect(field('Facebook')).toHaveAccessibleDescription(/https:\/\/facebook\.com\/your-page/)
  })

  it('keeps Save disabled until something changes', async () => {
    settingsServer()
    const { user } = renderWithProviders(<SettingsPage />, { route: '/settings' })
    await screen.findByLabelText('Email')
    expect(save()).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Discard changes' })).not.toBeInTheDocument()

    await user.type(field('Phone number'), '0')

    expect(save()).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeInTheDocument()

    await user.type(field('Phone number'), '{Backspace}') // back to the saved value
    expect(save()).toBeDisabled()
  })

  it('sends only the fields that changed', async () => {
    const server = settingsServer()
    const { user } = renderWithProviders(<SettingsPage />, { route: '/settings' })
    const phone = await screen.findByLabelText('Phone number')

    await user.clear(phone)
    await user.type(phone, '+963 111 222 333')
    await user.click(save())

    await waitFor(() => expect(server.calls('PUT', '/settings')).toHaveLength(1))
    expect(server.calls('PUT', '/settings')[0].body).toEqual({ phone: '+963 111 222 333' })
    expect(await screen.findByText('Saved')).toBeInTheDocument()
    await waitFor(() => expect(save()).toBeDisabled()) // the form now equals the saved values
    expect(field('Phone number')).toHaveValue('+963 111 222 333')
  })

  it('sends several changed fields together, trimmed', async () => {
    const server = settingsServer()
    const { user } = renderWithProviders(<SettingsPage />, { route: '/settings' })
    await screen.findByLabelText('Email')

    await user.type(field('WhatsApp'), '  https://wa.me/963933000000  ')
    await user.clear(field('Email'))
    await user.type(field('Email'), 'hello@ngptechworld.com')
    await user.click(save())

    await waitFor(() => expect(server.calls('PUT', '/settings')).toHaveLength(1))
    expect(server.calls('PUT', '/settings')[0].body).toEqual({ email: 'hello@ngptechworld.com', whatsapp: 'https://wa.me/963933000000' })
  })

  it('clearing a field sends null (that removes it from the site)', async () => {
    const server = settingsServer()
    const { user } = renderWithProviders(<SettingsPage />, { route: '/settings' })
    await screen.findByLabelText('Email')

    await user.clear(field('Facebook'))
    await user.clear(field('Email'))
    await user.click(save())

    await waitFor(() => expect(server.calls('PUT', '/settings')).toHaveLength(1))
    expect(server.calls('PUT', '/settings')[0].body).toEqual({ email: null, facebook: null })
    expect(field('Facebook')).toHaveValue('')
  })

  it('validates locally: an invalid link or email is not sent', async () => {
    const server = settingsServer()
    const { user } = renderWithProviders(<SettingsPage />, { route: '/settings' })
    await screen.findByLabelText('Email')

    await user.type(field('Instagram'), 'instagram.com/ngp')
    await user.clear(field('Email'))
    await user.type(field('Email'), 'not-an-email')
    await user.click(save())

    expect(await screen.findByText('Enter a valid URL (starting with http:// or https://)')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument()
    expect(field('Instagram')).toHaveAttribute('aria-invalid', 'true')
    expect(server.calls('PUT')).toHaveLength(0)
  })

  it('accepts http links too and refuses over-long values', async () => {
    const server = settingsServer()
    const { user } = renderWithProviders(<SettingsPage />, { route: '/settings' })
    await screen.findByLabelText('Email')

    await user.type(field('LinkedIn'), 'http://linkedin.com/company/ngp')
    await user.click(save())
    await waitFor(() => expect(server.calls('PUT', '/settings')).toHaveLength(1))
    expect(server.calls('PUT', '/settings')[0].body).toEqual({ linkedin: 'http://linkedin.com/company/ngp' })

    await user.clear(field('Phone number'))
    await user.type(field('Phone number'), '1'.repeat(41))
    await user.click(save())
    expect(await screen.findByText('At most 40 characters')).toBeInTheDocument()
    expect(server.calls('PUT', '/settings')).toHaveLength(1)
  })

  it('shows the server validation errors on the matching fields', async () => {
    settingsServer({ 'PUT /settings': () => validationError({ email: ['The email field must be a valid email address.'], whatsapp: ['The whatsapp field must be a valid URL.'] }) })
    const { user } = renderWithProviders(<SettingsPage />, { route: '/settings' })
    await screen.findByLabelText('Email')

    await user.type(field('WhatsApp'), 'https://wa.me/1')
    await user.click(save())

    expect(await screen.findByText('The whatsapp field must be a valid URL.')).toBeInTheDocument()
    expect(screen.getByText('The email field must be a valid email address.')).toBeInTheDocument()
    expect(field('Email')).toHaveFocus() // the first field the server complains about
    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument()
    expect(save()).toBeEnabled() // the user can correct and retry
  })

  it('shows a toast and keeps the input when the server is down', async () => {
    settingsServer({ 'PUT /settings': () => reply(500, { message: 'boom' }) })
    const { user } = renderWithProviders(<SettingsPage />, { route: '/settings' })
    await user.type(await screen.findByLabelText('Instagram'), 'https://instagram.com/ngp')

    await user.click(save())

    expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    expect(field('Instagram')).toHaveValue('https://instagram.com/ngp')
    expect(save()).toBeEnabled()
  })

  it('disables Save while the request runs', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    settingsServer({
      'PUT /settings': async ({ body }) => {
        await gate
        return { data: { ...settings, ...body } }
      },
    })
    const { user } = renderWithProviders(<SettingsPage />, { route: '/settings' })
    await user.type(await screen.findByLabelText('Instagram'), 'https://instagram.com/ngp')

    await user.click(save())

    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
    release()
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('"Discard changes" restores the saved values', async () => {
    const server = settingsServer()
    const { user } = renderWithProviders(<SettingsPage />, { route: '/settings' })
    await user.type(await screen.findByLabelText('Instagram'), 'https://instagram.com/ngp')

    await user.click(screen.getByRole('button', { name: 'Discard changes' }))

    expect(field('Instagram')).toHaveValue('')
    expect(save()).toBeDisabled()
    expect(server.calls('PUT')).toHaveLength(0)
  })

  it('shows a retryable error when the settings cannot be loaded', async () => {
    const server = settingsServer({ 'GET /settings': () => reply(500, { message: 'boom' }) })
    const { user } = renderWithProviders(<SettingsPage />, { route: '/settings' })

    expect(await screen.findByText('Could not load the settings')).toBeInTheDocument()
    expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()

    server.on('GET /settings', () => ({ data: settings }))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByLabelText('Email')).toHaveValue('info@ngptechworld.com')
  })

  it('shows what the server has when the page is opened again', async () => {
    let stored = settings
    mockApi({ 'GET /settings': () => ({ data: stored }) })
    const first = renderWithProviders(<SettingsPage />, { route: '/settings' })
    expect(await screen.findByLabelText('Phone number')).toHaveValue('+963 933 069 105')
    first.unmount()
    await new Promise((resolve) => setTimeout(resolve, 10)) // gcTime: 0 drops the cached copy right after the page is left

    stored = { ...settings, phone: '+963 000' }
    renderWithProviders(<SettingsPage />, { route: '/settings', queryClient: first.queryClient })
    expect(await screen.findByLabelText('Phone number')).toHaveValue('+963 000')
  })

  it('shows a switch per section and sends only the ones toggled', async () => {
    const server = settingsServer({ 'GET /settings': () => ({ data: { ...settings, sections: { faq: false } } }) })
    const { user } = renderWithProviders(<SettingsPage />, { route: '/settings' })

    expect(await screen.findByRole('switch', { name: 'FAQ' })).not.toBeChecked()
    expect(screen.getByRole('switch', { name: 'Testimonials' })).toBeChecked() // missing from the API = shown
    expect(save()).toBeDisabled()

    await user.click(screen.getByRole('switch', { name: 'Testimonials' }))
    await user.click(screen.getByRole('switch', { name: 'Team page (and member pages)' }))
    await user.click(save())

    await waitFor(() => expect(server.calls('PUT', '/settings')).toHaveLength(1))
    expect(server.calls('PUT', '/settings')[0].body).toEqual({ sections: { testimonials: false, team_page: false } })
  })
})
