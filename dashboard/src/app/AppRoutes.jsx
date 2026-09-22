import { useMemo } from 'react'
import { Navigate, useRoutes } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { ProtectedRoute } from './ProtectedRoute'
import { buildRoutes, features as discovered } from './features'
import { AppLayout } from './layout/AppLayout'
import { LoginPage } from './pages/Login'
import { NotFoundPage } from './pages/NotFound'
import { filterFeaturesByUser } from './permissions'

/**
 * /login is public; everything else renders inside the authenticated layout, with the routes contributed by every
 * feature (src/features/*\/index.jsx) plus a 404. `features` can be injected (tests).
 *
 * The route table (and, inside AppLayout, the sidebar) is trimmed to the sections the signed-in admin has
 * permission for (see permissions.js) — a feature filtered out has no route at all, so navigating to its URL by
 * hand lands on the 404 page, same as the backend's 403 for that same request. The dashboard overview (`/`) is
 * super-admin-only, so when no visible feature claims the index route, a limited admin is redirected straight
 * to their first available section instead — after signing in, and after clicking a brand link that points at
 * `/` — so they never hit that 404.
 */
export function AppRoutes({ features = discovered }) {
  const { user, status } = useAuth()
  const visible = useMemo(
    () => (status === 'authenticated' ? filterFeaturesByUser(features, user) : features),
    [features, user, status],
  )

  const routes = useMemo(() => {
    const visibleRoutes = buildRoutes(visible)
    const hasIndexRoute = visibleRoutes.some((route) => route.index)
    // First navigable (has a sidebar entry) section the admin can actually reach; `account` has none, so a
    // limited admin with zero section permissions still lands somewhere real instead of bouncing forever.
    const landingTo = hasIndexRoute ? null : (visible.find((feature) => feature.nav)?.nav.to ?? '/account')

    return [
      { path: '/login', element: <LoginPage /> },
      {
        element: (
          <ProtectedRoute>
            <AppLayout features={visible} />
          </ProtectedRoute>
        ),
        children: [
          ...(hasIndexRoute ? [] : [{ index: true, element: <Navigate to={landingTo} replace /> }]),
          ...visibleRoutes,
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ]
  }, [visible])
  return useRoutes(routes)
}
