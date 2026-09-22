import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, setUnauthorizedHandler } from '@/lib/api'
import { clearToken, getToken, setToken } from '@/lib/storage'

export const AuthContext = createContext(null)

/**
 * Owns the session: the token lives in localStorage (`ngp_admin_token`), `user` comes from GET /auth/me.
 *
 * status: 'loading' (validating a stored token) | 'authenticated' | 'anonymous' | 'error' (server unreachable
 * while validating — the token is kept so a reload can succeed).
 * A 401 from any API call clears the session (api.js → setUnauthorizedHandler) and <ProtectedRoute> sends the
 * user to /login.
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(() => (getToken() ? 'loading' : 'anonymous'))
  const [attempt, setAttempt] = useState(0)

  const clearSession = useCallback(() => {
    clearToken()
    setUser(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  useEffect(() => setUnauthorizedHandler(clearSession), [clearSession])

  // validate the stored token once (and again on retry)
  useEffect(() => {
    if (!getToken()) return undefined
    let cancelled = false
    setStatus('loading')
    api
      .get('/auth/me')
      .then((res) => {
        if (cancelled) return
        setUser(res.data)
        setStatus('authenticated')
      })
      .catch((err) => {
        if (cancelled || err.status === 401) return // 401 already cleared the session
        if (err.status === 403) clearSession()
        else setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [attempt, clearSession])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password, device_name: 'ngp-dashboard' }, { auth: false })
    setToken(res.data.token)
    setUser(res.data.user)
    setStatus('authenticated')
    return res.data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      /* the token may already be invalid — we are signing out anyway */
    }
    clearSession()
  }, [clearSession])

  const updateUser = useCallback((patch) => setUser((current) => (current ? { ...current, ...patch } : current)), [])
  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  const value = useMemo(
    () => ({ user, status, isAuthenticated: status === 'authenticated', isLoading: status === 'loading', login, logout, updateUser, retry }),
    [user, status, login, logout, updateUser, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * const { user, login, logout, updateUser, status, isAuthenticated } = useAuth()
 * `updateUser({ name })` refreshes the name shown in the top bar after a profile update.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>')
  return ctx
}
