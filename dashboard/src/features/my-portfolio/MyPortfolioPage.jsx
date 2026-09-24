import { useState } from 'react'
import { useAuth } from '@/app/AuthProvider'
import { useCommon, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, PageHeader, PageSpinner, TabPanel, Tabs } from '@/ui'
import { PortfolioTab } from '@/features/team/PortfolioTab'
import { toPayload, toSelfFormValues } from '@/features/team/schema'
import { TeamForm } from '@/features/team/TeamForm'
import { useMyProfile, useSaveMyProfile } from './hooks'
import strings from './strings'

/** The member's own profile: the team form without the admin-only fields, saved through /my-profile. */
function ProfileTab() {
  const c = useCommon()
  const t = useStrings(strings)
  const query = useMyProfile()
  const save = useSaveMyProfile()

  if (query.isLoading) return <PageSpinner />
  if (!query.data) {
    return (
      <Alert tone="danger" title={t.loadFailed} action={<Button size="sm" variant="secondary" onClick={() => query.refetch()}>{c.retry}</Button>}>
        {errorText(query.error, c)}
      </Alert>
    )
  }

  const profile = query.data
  // Keyed by the save time: after a save the form starts again from what the server stored, so Save is disabled
  // until the next change.
  return (
    <TeamForm
      key={query.dataUpdatedAt}
      self
      isEdit
      defaultValues={toSelfFormValues(profile)}
      avatarUrl={profile.avatar_url}
      onSubmit={(values) => save.mutateAsync(toPayload(values))}
      saving={save.isPending}
    />
  )
}

/** /my-profile — the signed-in admin's own profile and projects (the one team profile linked to their account, see
 * TeamProfile::user()). Only ever visible in the sidebar when `user.team_profile_id` is set — see
 * app/permissions.js. The backend decides who may act on what; this page always points at the signed-in admin's own. */
export default function MyPortfolioPage() {
  const t = useStrings(strings)
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')

  if (!user) return <PageSpinner />

  return (
    <>
      <PageHeader title={t.pageTitle} description={t.pageDescription} />
      {user.team_profile_id ? (
        <>
          <Tabs
            idPrefix="my-portfolio"
            label={t.pageTitle}
            tabs={[
              { key: 'profile', label: t.tabProfile },
              { key: 'projects', label: t.tabProjects },
            ]}
            value={tab}
            onChange={setTab}
            className="mb-5"
          />
          <TabPanel idPrefix="my-portfolio" value="profile" active={tab} keepMounted>
            <ProfileTab />
          </TabPanel>
          <TabPanel idPrefix="my-portfolio" value="projects" active={tab}>
            <PortfolioTab teamId={user.team_profile_id} />
          </TabPanel>
        </>
      ) : (
        <p className="text-sm text-muted">{t.noProfileLinked}</p>
      )}
    </>
  )
}
