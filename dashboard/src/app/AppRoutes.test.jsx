import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Home, Info } from 'lucide-react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '@/i18n'
import { TOKEN_KEY } from '@/lib/storage'
import { mockApi } from '@/test/mockApi'
import { createTestQueryClient } from '@/test/renderWithProviders'
import { ConfirmProvider, ToastProvider } from '@/ui'
import { AppRoutes } from './AppRoutes'
import { AuthProvider } from './AuthProvider'
import { ErrorBoundary } from './ErrorBoundary'

// A super admin, so permission filtering (permissions.js) is a no-op here — that logic has its own tests
// (features.test.jsx / users feature tests). This file is about the shell's generic mechanics.
const admin = { id: 1, name: 'Sara Admin', email: 'sara@ngptechworld.com', role: 'super_admin', is_super_admin: true, permissions: [] }

const fakeFeatures = [
  { id: 'home', nav: { order: 10, group: 'main', icon: Home, label: { ar: 'الرئيسية', en: 'Home' }, to: '/' }, routes: [{ index: true, element: <h1>Home page</h1> }] },
  { id: 'about', nav: { order: 20, group: 'content', icon: Info, label: { ar: 'حول', en: 'About' }, to: '/about' }, routes: [{ path: 'about', element: <h1>About page</h1> }] },
  { id: 'users', nav: { order: 110, group: 'system', icon: Info, label: { ar: 'المستخدمون', en: 'Users' }, to: '/users' }, routes: [{ path: 'users', element: <h1>Users page</h1> }] },
  { id: 'account', routes: [{ path: 'account', element: <h1>Account page</h1> }] }, // no nav — like the real feature
  {
    id: 'crashy',
    routes: [
      {
        path: 'crash',
        element: (
          <ThrowOnRender />
        ),
      },
    ],
  },
]

function ThrowOnRender() {
  throw new Error('kaboom')
}

function renderApp({ route = '/', lang = 'en', signedIn = true, features = fakeFeatures } = {}) {
  if (signedIn) localStorage.setItem(TOKEN_KEY, 'tok')
  const user = userEvent.setup()
  const utils = render(
    <QueryClientProvider client={createTestQueryClient()}>
      <LanguageProvider initialLang={lang}>
        <ToastProvider>
          <ConfirmProvider>
            <MemoryRouter initialEntries={[route]}>
              <AuthProvider>
                <AppRoutes features={features} />
              </AuthProvider>
            </MemoryRouter>
          </ConfirmProvider>
        </ToastProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  )
  return { user, ...utils }
}

describe('app shell', () => {
  it('sends anonymous visitors to the login page', async () => {
    mockApi({})
    renderApp({ signedIn: false, route: '/about' })
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('renders the routed page inside the layout with a grouped sidebar', async () => {
    mockApi({ 'GET /auth/me': { data: admin } })
    renderApp({ route: '/about' })

    expect(await screen.findByRole('heading', { name: 'About page' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation')
    expect(within(nav).getByText('Main')).toBeInTheDocument()
    expect(within(nav).getByText('Content')).toBeInTheDocument()
    expect(within(nav).getByText('System')).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('navigates between features through the sidebar', async () => {
    mockApi({ 'GET /auth/me': { data: admin } })
    const { user } = renderApp({ route: '/' })
    await screen.findByRole('heading', { name: 'Home page' })

    await user.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'About' }))

    expect(await screen.findByRole('heading', { name: 'About page' })).toBeInTheDocument()
  })

  it('shows a 404 page inside the layout for unknown routes', async () => {
    mockApi({ 'GET /auth/me': { data: admin } })
    renderApp({ route: '/nowhere' })
    expect(await screen.findByText('Page not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the dashboard' })).toHaveAttribute('href', '/')
  })

  it('the top bar shows the user, links to the account feature and signs out', async () => {
    const server = mockApi({ 'GET /auth/me': { data: admin }, 'POST /auth/logout': () => null })
    const { user } = renderApp({ route: '/' })
    await screen.findByRole('heading', { name: 'Home page' })

    await user.click(screen.getByRole('button', { name: 'Account menu' }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getByText('sara@ngptechworld.com')).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'My account' })).toHaveAttribute('href', '/account')

    await user.click(within(menu).getByRole('menuitem', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(server.calls('POST', '/auth/logout')).toHaveLength(1)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('the language toggle switches the shell to Arabic / RTL', async () => {
    mockApi({ 'GET /auth/me': { data: admin } })
    const { user } = renderApp({ route: '/' })
    await screen.findByRole('heading', { name: 'Home page' })

    await user.click(screen.getByRole('button', { name: 'Switch to Arabic' }))

    expect(document.documentElement.dir).toBe('rtl')
    expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'حول' })).toBeInTheDocument()
    expect(screen.getByText('المحتوى')).toBeInTheDocument()
  })

  it('the mobile menu button opens the drawer, Escape closes it', async () => {
    mockApi({ 'GET /auth/me': { data: admin } })
    const { user } = renderApp({ route: '/' })
    await screen.findByRole('heading', { name: 'Home page' })
    const button = screen.getByRole('button', { name: 'Open menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument())
  })

  it('has a skip-to-content link', async () => {
    mockApi({ 'GET /auth/me': { data: admin } })
    renderApp({ route: '/' })
    expect(await screen.findByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main-content')
  })

  it('a page that crashes shows the error fallback while the shell keeps working', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockApi({ 'GET /auth/me': { data: admin } })
    const { user } = renderApp({ route: '/crash' })

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument()

    // the error clears when navigating to another page
    await user.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'About' }))
    expect(await screen.findByRole('heading', { name: 'About page' })).toBeInTheDocument()
    spy.mockRestore()
  })

  it('a limited admin who cannot see the index route lands on their first available section instead of 404', async () => {
    // `home` claims the index route ('/') but is not in this admin's permissions — same shape as the real
    // `dashboard` feature being super-admin-only.
    const limited = { id: 2, name: 'Reem', email: 'reem@ngptechworld.com', role: 'admin', is_super_admin: false, permissions: ['about'] }
    mockApi({ 'GET /auth/me': { data: limited } })

    renderApp({ route: '/' })

    expect(await screen.findByRole('heading', { name: 'About page' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument()
  })

  it('falls back to /account when a limited admin has no navigable section at all', async () => {
    const limited = { id: 2, name: 'Reem', email: 'reem@ngptechworld.com', role: 'admin', is_super_admin: false, permissions: [] }
    mockApi({ 'GET /auth/me': { data: limited } })

    renderApp({ route: '/' })

    expect(await screen.findByRole('heading', { name: 'Account page' })).toBeInTheDocument()
  })
})

describe('ErrorBoundary', () => {
  it('catches render errors and can retry', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let shouldThrow = true
    const Flaky = () => {
      if (shouldThrow) throw new Error('flaky')
      return <p>recovered</p>
    }
    const user = userEvent.setup()
    render(
      <LanguageProvider initialLang="en">
        <ErrorBoundary>
          <Flaky />
        </ErrorBoundary>
      </LanguageProvider>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('recovered')).toBeInTheDocument()
    spy.mockRestore()
  })
})
