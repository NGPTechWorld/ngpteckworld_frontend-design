import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '@/i18n'
import { api } from '@/lib/api'
import { TOKEN_KEY } from '@/lib/storage'
import { mockApi, reply } from '@/test/mockApi'
import { createTestQueryClient } from '@/test/renderWithProviders'
import { ConfirmProvider, ToastProvider } from '@/ui'
import { AuthProvider, useAuth } from './AuthProvider'
import { ProtectedRoute } from './ProtectedRoute'

const admin = { id: 1, name: 'Sara', email: 'sara@ngptechworld.com' }

function Probe() {
  const { user, status, login, logout, updateUser } = useAuth()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user ? user.name : 'nobody'}</span>
      <button onClick={() => login('sara@ngptechworld.com', 'secret123').catch(() => {})}>login</button>
      <button onClick={logout}>logout</button>
      <button onClick={() => updateUser({ name: 'Renamed' })}>rename</button>
    </div>
  )
}

function Where() {
  const location = useLocation()
  return <div data-testid="where">{location.pathname}</div>
}

function renderAuth(ui, { route = '/' } = {}) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <LanguageProvider initialLang="en">
        <ToastProvider>
          <ConfirmProvider>
            <MemoryRouter initialEntries={[route]}>
              <AuthProvider>{ui}</AuthProvider>
              <Where />
            </MemoryRouter>
          </ConfirmProvider>
        </ToastProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

describe('AuthProvider', () => {
  it('is anonymous without a stored token and never calls the API', () => {
    const server = mockApi({})
    renderAuth(<Probe />)
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    expect(server.requests).toHaveLength(0)
  })

  it('validates a stored token with GET /auth/me', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored')
    const server = mockApi({ 'GET /auth/me': { data: admin } })

    renderAuth(<Probe />)
    expect(screen.getByTestId('status')).toHaveTextContent('loading')

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('user')).toHaveTextContent('Sara')
    expect(server.requests[0].headers.authorization).toBe('Bearer stored')
  })

  it('drops an invalid token (401) and becomes anonymous', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired')
    mockApi({ 'GET /auth/me': () => reply(401, { message: 'Unauthenticated.' }) })

    renderAuth(<Probe />)

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('keeps the token and reports "error" when the server is unreachable', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored')
    mockApi({ 'GET /auth/me': () => reply(500, { message: 'boom' }) })

    renderAuth(<Probe />)

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'))
    expect(localStorage.getItem(TOKEN_KEY)).toBe('stored')
  })

  it('login stores the token and the user', async () => {
    const user = userEvent.setup()
    const server = mockApi({ 'POST /auth/login': () => ({ data: { token: 'new-token', user: admin } }) })
    renderAuth(<Probe />)

    await user.click(screen.getByText('login'))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(localStorage.getItem(TOKEN_KEY)).toBe('new-token')
    expect(server.calls('POST', '/auth/login')[0].body).toEqual({ email: 'sara@ngptechworld.com', password: 'secret123', device_name: 'ngp-dashboard' })
    expect(server.requests[0].headers.authorization).toBeUndefined()
  })

  it('a failed login leaves the session anonymous', async () => {
    const user = userEvent.setup()
    mockApi({ 'POST /auth/login': () => reply(422, { message: 'bad', errors: { email: ['bad'] } }) })
    renderAuth(<Probe />)

    await user.click(screen.getByText('login'))

    expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('logout revokes the token on the server and clears the session', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored')
    const user = userEvent.setup()
    const server = mockApi({ 'GET /auth/me': { data: admin }, 'POST /auth/logout': () => null })
    renderAuth(<Probe />)
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    await user.click(screen.getByText('logout'))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    expect(server.calls('POST', '/auth/logout')).toHaveLength(1)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('logout still signs out when the server call fails', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored')
    const user = userEvent.setup()
    mockApi({ 'GET /auth/me': { data: admin }, 'POST /auth/logout': () => reply(500, {}) })
    renderAuth(<Probe />)
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    await user.click(screen.getByText('logout'))

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
  })

  it('a 401 anywhere in the app signs the user out', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored')
    mockApi({ 'GET /auth/me': { data: admin }, 'GET /faqs': () => reply(401, { message: 'Unauthenticated.' }) })
    renderAuth(<Probe />)
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    await api.get('/faqs').catch(() => {})

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('updateUser merges into the current user', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored')
    const user = userEvent.setup()
    mockApi({ 'GET /auth/me': { data: admin } })
    renderAuth(<Probe />)
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Sara'))

    await user.click(screen.getByText('rename'))

    expect(screen.getByTestId('user')).toHaveTextContent('Renamed')
  })

  it('useAuth outside the provider explains itself', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/AuthProvider/)
    spy.mockRestore()
  })
})

describe('ProtectedRoute', () => {
  function app(route) {
    return renderAuth(
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route
          path="/secret"
          element={
            <ProtectedRoute>
              <div>secret area</div>
            </ProtectedRoute>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route path="/nested" element={<div>nested area</div>} />
        </Route>
      </Routes>,
      { route },
    )
  }

  it('redirects anonymous visitors to /login', async () => {
    mockApi({})
    app('/secret')
    expect(await screen.findByText('login page')).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent('/login')
  })

  it('shows a spinner while the stored token is being validated, then the page', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored')
    mockApi({ 'GET /auth/me': { data: admin } })
    app('/secret')

    expect(screen.queryByText('secret area')).not.toBeInTheDocument()
    expect(await screen.findByText('secret area')).toBeInTheDocument()
  })

  it('renders nested routes through <Outlet/>', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored')
    mockApi({ 'GET /auth/me': { data: admin } })
    app('/nested')
    expect(await screen.findByText('nested area')).toBeInTheDocument()
  })

  it('redirects to /login when the token turns out to be invalid', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired')
    mockApi({ 'GET /auth/me': () => reply(401, {}) })
    app('/secret')
    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('offers a retry when the server cannot be reached', async () => {
    localStorage.setItem(TOKEN_KEY, 'stored')
    const user = userEvent.setup()
    const server = mockApi({ 'GET /auth/me': () => reply(500, {}) })
    app('/secret')

    expect(await screen.findByText('Cannot reach the server')).toBeInTheDocument()

    server.on('GET /auth/me', { data: admin })
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('secret area')).toBeInTheDocument()
  })
})
