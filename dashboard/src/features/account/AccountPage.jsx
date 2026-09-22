import { useAuth } from '@/app/AuthProvider'
import { useStrings } from '@/i18n'
import { PageHeader, PageSpinner } from '@/ui'
import { PasswordForm } from './PasswordForm'
import { ProfileForm } from './ProfileForm'
import strings from './strings'

/** /account — the signed-in admin's own profile and password (the user comes from the auth context, GET /auth/me).
 * Reachable by every admin, including one with no section permissions at all. */
export default function AccountPage() {
  const t = useStrings(strings)
  const { user } = useAuth()

  return (
    <>
      {/* The Users list (and its back link here) is super-admin-only — a limited admin never sees it. */}
      <PageHeader title={t.accountTitle} description={t.accountDescription} backTo={user?.is_super_admin ? '/users' : undefined} backLabel={t.backToUsers} />
      {user ? (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          {/* keyed by id: the form reads its defaults once */}
          <ProfileForm key={user.id} user={user} />
          <PasswordForm />
        </div>
      ) : (
        <PageSpinner />
      )}
    </>
  )
}
