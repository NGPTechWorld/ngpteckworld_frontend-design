import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LanguageProvider } from '@/i18n'
import { TOKEN_KEY } from '@/lib/storage'
import { mockApi, reply, validationError } from '@/test/mockApi'
import { createTestQueryClient } from '@/test/renderWithProviders'
import { ConfirmProvider, ToastProvider } from '@/ui'
import { AuthProvider } from '../AuthProvider'
import { LoginPage } from './Login'

const admin = { id: 1, name: 'Sara', email: 'sara@ngptechworld.com' }

function renderLogin({ route = '/login', lang = 'en' } = {}) {
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <LanguageProvider initialLang={lang}>
        <ToastProvider>
          <ConfirmProvider>
            <MemoryRouter initialEntries={[route]}>
              <AuthProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/" element={<div>home page</div>} />
                  <Route path="/faqs" element={<div>faq page</div>} />
                </Routes>
              </AuthProvider>
            </MemoryRouter>
          </ConfirmProvider>
        </ToastProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  )
  return user
}

const fill = async (user, email = 'sara@ngptechworld.com', password = 'secret123') => {
  if (email) await user.type(screen.getByLabelText(/Email/), email)
  if (password) await user.type(screen.getByLabelText(/^Password/), password)
}
const submit = (user) => user.click(screen.getByRole('button', { name: 'Sign in' }))

describe('LoginPage', () => {
  it('renders the branded form in English and Arabic', () => {
    renderLogin({ lang: 'ar' })
    expect(screen.getByRole('heading', { name: 'تسجيل الدخول' })).toBeInTheDocument()
    expect(screen.getByAltText('NGP TechWorld')).toBeInTheDocument()
    expect(screen.getByLabelText(/البريد الإلكتروني/)).toHaveAttribute('dir', 'ltr')
  })

  it('validates required fields and the email format without calling the API', async () => {
    const server = mockApi({})
    const user = renderLogin()

    await submit(user)
    expect(await screen.findByText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Email/), 'not-an-email')
    await user.type(screen.getByLabelText(/^Password/), 'x')
    await submit(user)
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(server.requests).toHaveLength(0)
  })

  it('signs in, stores the token and goes home', async () => {
    const server = mockApi({ 'POST /auth/login': () => ({ data: { token: 'abc', user: admin } }) })
    const user = renderLogin()

    await fill(user)
    await submit(user)

    expect(await screen.findByText('home page')).toBeInTheDocument()
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc')
    expect(server.calls('POST', '/auth/login')[0].body).toMatchObject({ email: 'sara@ngptechworld.com', password: 'secret123' })
  })

  it('returns to the page the visitor wanted (state.from)', async () => {
    mockApi({ 'POST /auth/login': () => ({ data: { token: 'abc', user: admin } }) })
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <LanguageProvider initialLang="en">
          <ToastProvider>
            <ConfirmProvider>
              <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: '/faqs', search: '?page=2' } } }]}>
                <AuthProvider>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/faqs" element={<div>faq page</div>} />
                  </Routes>
                </AuthProvider>
              </MemoryRouter>
            </ConfirmProvider>
          </ToastProvider>
        </LanguageProvider>
      </QueryClientProvider>,
    )

    await fill(user)
    await submit(user)

    expect(await screen.findByText('faq page')).toBeInTheDocument()
  })

  it('shows a localized "wrong credentials" error on the email field for a 422', async () => {
    mockApi({ 'POST /auth/login': () => validationError({ email: ['These credentials do not match our records.'] }) })
    const user = renderLogin()

    await fill(user)
    await submit(user)

    expect(await screen.findByText('The credentials are incorrect.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('aria-invalid', 'true')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('shows a message for a non-admin account (403)', async () => {
    mockApi({ 'POST /auth/login': () => reply(403, { message: 'Forbidden' }) })
    const user = renderLogin()

    await fill(user)
    await submit(user)

    expect(await screen.findByText('This account is not allowed to use the dashboard.')).toBeInTheDocument()
  })

  it('shows how long to wait after too many attempts (429)', async () => {
    mockApi({ 'POST /auth/login': () => reply(429, { message: 'Too Many Attempts.' }, { 'Retry-After': '37' }) })
    const user = renderLogin()

    await fill(user)
    await submit(user)

    expect(await screen.findByText('Too many attempts. Try again in 37 seconds.')).toBeInTheDocument()
  })

  it('shows a network error banner', async () => {
    const server = mockApi({})
    server.fetch.mockRejectedValue(new TypeError('Failed to fetch'))
    const user = renderLogin()

    await fill(user)
    await submit(user)

    expect(await screen.findByText('Cannot reach the server. Check your internet connection.')).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    const user = renderLogin()
    const input = screen.getByLabelText(/^Password/)
    expect(input).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('the language button flips the page to Arabic / RTL', async () => {
    const user = renderLogin()
    await user.click(screen.getByRole('button', { name: 'Switch to Arabic' }))
    expect(screen.getByRole('heading', { name: 'تسجيل الدخول' })).toBeInTheDocument()
    expect(document.documentElement.dir).toBe('rtl')
  })

  it('redirects away when already signed in', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored')
    mockApi({ 'GET /auth/me': { data: admin } })
    renderLogin()
    await waitFor(() => expect(screen.getByText('home page')).toBeInTheDocument())
  })
})
