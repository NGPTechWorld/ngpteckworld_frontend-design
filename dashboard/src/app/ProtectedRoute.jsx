import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { CloudOff } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { Button, EmptyState, PageSpinner } from '@/ui'
import { useAuth } from './AuthProvider'
import strings from './strings'

/**
 * Renders its children (or the nested routes via <Outlet/>) only for a signed-in admin.
 * Anonymous → redirect to /login remembering where the user wanted to go (`state.from`).
 */
export function ProtectedRoute({ children }) {
  const { status, retry } = useAuth()
  const location = useLocation()
  const t = useStrings(strings)
  const c = useCommon()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deep" aria-busy="true">
        <PageSpinner />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deep px-4">
        <EmptyState icon={CloudOff} title={t.serverUnreachable} description={t.serverUnreachableHint} action={<Button onClick={retry}>{c.retry}</Button>} />
      </div>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children ?? <Outlet />
}
