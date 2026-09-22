import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/AppRoutes'
import { AuthProvider } from '@/app/AuthProvider'
import { LanguageProvider } from '@/i18n'
import { TOKEN_KEY } from '@/lib/storage'
import { mockApi, paginated } from '@/test/mockApi'
import { createTestQueryClient } from '@/test/renderWithProviders'
import { ConfirmProvider, ToastProvider } from '@/ui'
import account from '../account'
import requests from '../requests'
import settings from '../settings'
import users from '../users'
import dashboard from './index'
import { makeDashboard, makeRequest } from './testData'

// The four sections of this folder group, mounted in the real app shell (real AuthProvider, sidebar, top bar),
// plus `account` since the top bar's "My account" link depends on it being present (see app/layout/AppLayout.jsx).
const features = [dashboard, requests, settings, users, account]
// A super admin: permission filtering itself is covered by app/permissions.test.js and the users feature's own tests.
const admin = { id: 1, name: 'Sara Admin', email: 'sara@ngptechworld.com', role: 'super_admin', is_super_admin: true, permissions: [] }
const inbox = [makeRequest(5, { name: 'Sara Ahmad' }), makeRequest(4, { name: 'Omar Khaled', status: 'in_progress' })]

function renderApp(route, { user: authUser = admin } = {}) {
  localStorage.setItem(TOKEN_KEY, 'tok')
  const server = mockApi({
    'GET /auth/me': { data: authUser },
    'GET /dashboard': () => makeDashboard(),
    'GET /requests': () => paginated(inbox),
    'GET /requests/:id': ({ params }) => ({ data: inbox.find((row) => String(row.id) === params.id) ?? inbox[0] }),
    'GET /users': () => paginated([admin, { id: 2, name: 'Layla Hassan', email: 'layla@ngptechworld.com', role: 'admin', permissions: ['requests'], created_at: '2026-09-02T10:00:00Z' }]),
    'GET /settings': () => ({ data: { email: 'info@ngptechworld.com', phone: null, facebook: null, instagram: null, linkedin: null, x: null, whatsapp: null } }),
    'PUT /auth/profile': ({ body }) => ({ data: { id: 1, ...body } }),
    'PUT /auth/password': () => null,
  })
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <LanguageProvider initialLang="en">
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
  return { user, server }
}
const nav = () => within(screen.getByRole('complementary', { name: 'Main navigation' })) // the sidebar (a page can hold other <nav>s, e.g. pagination)

describe('dashboard, requests, settings and users inside the app shell', () => {
  it('serves the dashboard at "/" with the four sections in the sidebar', async () => {
    renderApp('/')

    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome back, Sara' })).toBeInTheDocument()
    expect(nav().getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
    expect(nav().getByRole('link', { name: 'Requests' })).toHaveAttribute('href', '/requests')
    expect(nav().getByRole('link', { name: 'Site settings' })).toHaveAttribute('href', '/settings')
    expect(nav().getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/users')
    // `account` has no nav entry of its own (see features/account/index.jsx) — reached only via the top bar / Users card.
    expect(nav().queryByRole('link', { name: 'My account' })).not.toBeInTheDocument()
  })

  it('the "New requests" card opens the inbox filtered by status, and a recent request opens its detail page', async () => {
    const { user, server } = renderApp('/')
    await screen.findByRole('img', { name: /^Requests per day/ })

    await user.click(screen.getByRole('link', { name: /^New requests/ }))

    expect(await screen.findByRole('tab', { name: /^New/ })).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(server.calls('GET', '/requests').at(-1).query.status).toBe('new'))
    expect(nav().getByRole('link', { name: 'Requests' })).toHaveAttribute('aria-current', 'page')

    await user.click(await screen.findByRole('link', { name: 'Omar Khaled' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Omar Khaled' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('in_progress')
  })

  it('the top bar "My account" link goes straight to /account; the Users list also has a card leading there', async () => {
    const { user } = renderApp('/')
    await screen.findByRole('heading', { level: 1, name: 'Welcome back, Sara' })

    await user.click(screen.getByRole('button', { name: 'Account menu' }))
    await user.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'My account' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'My account' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Name/)).toHaveValue('Sara Admin')

    await user.click(nav().getByRole('link', { name: 'Users' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Users' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'My account' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'My account' })).toBeInTheDocument()
  })

  it('saving your profile updates the name in the top bar; changing the password keeps you signed in', async () => {
    const { user, server } = renderApp('/account')
    const name = await screen.findByLabelText(/^Name/)
    expect(screen.getByRole('button', { name: 'Account menu' })).toHaveTextContent('Sara Admin')

    await user.clear(name)
    await user.type(name, 'Baraa Ali')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Account menu' })).toHaveTextContent('Baraa Ali'))
    expect(server.calls('PUT', '/auth/profile')[0].body).toEqual({ name: 'Baraa Ali', email: 'sara@ngptechworld.com' })

    await user.type(screen.getByLabelText(/^Current password/), 'old-password')
    await user.type(screen.getByLabelText(/^New password/), 'new-password-1')
    await user.type(screen.getByLabelText(/^Confirm new password/), 'new-password-1')
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('Password changed. You were signed out of your other devices.')).toBeInTheDocument()
    expect(localStorage.getItem(TOKEN_KEY)).toBe('tok')
    expect(screen.getByRole('heading', { level: 1, name: 'My account' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument()
  })

  it('serves the site settings page', async () => {
    renderApp('/settings')

    expect(await screen.findByRole('heading', { level: 1, name: 'Site settings' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Email')).toHaveValue('info@ngptechworld.com')
    expect(nav().getByRole('link', { name: 'Site settings' })).toHaveAttribute('aria-current', 'page')
  })

  it('the user routes exist: list, new, edit', async () => {
    const { user } = renderApp('/users')

    await user.click(await screen.findByRole('link', { name: 'New user' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Add a user' })).toBeInTheDocument()
    expect(nav().getByRole('link', { name: 'Users' })).toHaveAttribute('aria-current', 'page')
  })

  it('a limited admin never sees the dashboard overview or Users, even with a requests permission', async () => {
    const limited = { id: 3, name: 'Reem', email: 'reem@ngptechworld.com', role: 'admin', is_super_admin: false, permissions: ['requests'] }

    renderApp('/', { user: limited })

    // redirected straight to Requests, their only section — never a blank/forbidden dashboard, never a 404
    expect(await screen.findByRole('heading', { level: 1, name: 'Requests' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
    expect(nav().getByRole('link', { name: 'Requests' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('feature contract', () => {
  const navigable = features.filter((feature) => feature.nav)

  it('keeps the planned ids, nav orders, groups and targets', () => {
    const summary = navigable.map(({ id, nav: n }) => [id, n.order, n.group, n.to])
    expect(summary).toEqual([
      ['dashboard', 10, 'main', '/'],
      ['requests', 20, 'main', '/requests'],
      ['settings', 100, 'system', '/settings'],
      ['users', 110, 'system', '/users'],
    ])
  })

  it('registers the routes of every page, including account (no nav entry of its own)', () => {
    const paths = Object.fromEntries(features.map((feature) => [feature.id, feature.routes.map((route) => (route.index ? '(index)' : route.path))]))
    expect(paths).toEqual({
      dashboard: ['(index)'],
      requests: ['requests', 'requests/:id'],
      settings: ['settings'],
      users: ['users', 'users/new', 'users/:id'],
      account: ['account'],
    })
    expect(account.nav).toBeUndefined()
  })
})
