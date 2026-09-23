import { useAuth } from '@/app/AuthProvider'
import { useStrings } from '@/i18n'
import { PageHeader, PageSpinner } from '@/ui'
import { PortfolioTab } from '@/features/team/PortfolioTab'
import strings from './strings'

/** /my-portfolio — the signed-in admin's own portfolio (the one team profile linked to their account, see
 * TeamProfile::user()). Only ever visible in the sidebar when `user.team_profile_id` is set — see
 * app/permissions.js. Reuses the exact same list/form the "Our Team" admin uses for a member's portfolio;
 * the backend decides who may act on this teamId, this page just always points at the signed-in admin's own. */
export default function MyPortfolioPage() {
  const t = useStrings(strings)
  const { user } = useAuth()

  if (!user) return <PageSpinner />

  return (
    <>
      <PageHeader title={t.pageTitle} description={t.pageDescription} />
      {user.team_profile_id ? <PortfolioTab teamId={user.team_profile_id} /> : <p className="text-sm text-muted">{t.noProfileLinked}</p>}
    </>
  )
}
