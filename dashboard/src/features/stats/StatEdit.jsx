import { useNavigate, useParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, EmptyState, PageHeader, PageSpinner } from '@/ui'
import { StatForm } from './StatForm'
import { stats } from './hooks'
import { toFormValues } from './schema'
import strings from './strings'

export default function StatEdit() {
  const { id } = useParams()
  const t = useStrings(strings)
  const c = useCommon()
  const navigate = useNavigate()
  const { data: stat, isLoading, isError, error, refetch } = stats.useOne(id)
  const update = stats.useUpdate()

  if (isLoading) return <PageSpinner />

  if (isError) {
    return error.status === 404 ? (
      <EmptyState icon={SearchX} title={t.notFoundTitle} description={c.itemNotFound} action={<Button to="/stats">{t.title}</Button>} />
    ) : (
      <Alert tone="danger" title={c.loadFailed} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{c.retry}</Button>}>
        {errorText(error, c)}
      </Alert>
    )
  }

  const onSubmit = async (values) => {
    await update.mutateAsync({ id: stat.id, data: values })
    navigate('/stats')
  }

  return (
    <>
      <PageHeader title={t.editTitle} backTo="/stats" backLabel={t.title} />
      <StatForm key={stat.id} isEdit defaultValues={toFormValues(stat)} onSubmit={onSubmit} saving={update.isPending} />
    </>
  )
}
