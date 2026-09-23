import { useNavigate, useParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, EmptyState, PageHeader, PageSpinner } from '@/ui'
import { team } from './hooks'
import { PortfolioTab } from './PortfolioTab'
import { toFormValues, toPayload } from './schema'
import strings from './strings'
import { TeamForm } from './TeamForm'

export default function TeamEdit() {
  const { id } = useParams()
  const t = useStrings(strings)
  const c = useCommon()
  const navigate = useNavigate()
  const { data: profile, isLoading, isError, error, refetch } = team.useOne(id)
  const update = team.useUpdate()

  if (isLoading) return <PageSpinner />

  if (isError) {
    return error.status === 404 ? (
      <EmptyState icon={SearchX} title={t.notFoundTitle} description={c.itemNotFound} action={<Button to="/team">{t.title}</Button>} />
    ) : (
      <Alert tone="danger" title={c.loadFailed} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{c.retry}</Button>}>
        {errorText(error, c)}
      </Alert>
    )
  }

  const onSubmit = async (values) => {
    await update.mutateAsync({ id: profile.id, data: toPayload(values) })
    navigate('/team')
  }

  return (
    <>
      <PageHeader title={t.editTitle} backTo="/team" backLabel={t.title} />
      <TeamForm key={profile.id} isEdit defaultValues={toFormValues(profile)} avatarUrl={profile.avatar_url} onSubmit={onSubmit} saving={update.isPending} />
      <div className="mt-5">
        <PortfolioTab teamId={profile.id} />
      </div>
    </>
  )
}
