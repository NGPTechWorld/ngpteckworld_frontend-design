import { useNavigate, useParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, EmptyState, PageHeader, PageSpinner } from '@/ui'
import { PartnerForm } from './PartnerForm'
import { partners } from './hooks'
import { toFormValues, toPayload } from './schema'
import strings from './strings'

export default function PartnerEdit() {
  const { id } = useParams()
  const t = useStrings(strings)
  const c = useCommon()
  const navigate = useNavigate()
  const { data: partner, isLoading, isError, error, refetch } = partners.useOne(id)
  const update = partners.useUpdate()

  if (isLoading) return <PageSpinner />

  if (isError) {
    return error.status === 404 ? (
      <EmptyState icon={SearchX} title={t.notFoundTitle} description={c.itemNotFound} action={<Button to="/partners">{t.title}</Button>} />
    ) : (
      <Alert tone="danger" title={c.loadFailed} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{c.retry}</Button>}>
        {errorText(error, c)}
      </Alert>
    )
  }

  const onSubmit = async (values) => {
    await update.mutateAsync({ id: partner.id, data: toPayload(values) })
    navigate('/partners')
  }

  return (
    <>
      <PageHeader title={t.editTitle} backTo="/partners" backLabel={t.title} />
      <PartnerForm key={partner.id} isEdit defaultValues={toFormValues(partner)} logoUrl={partner.logo_url} onSubmit={onSubmit} saving={update.isPending} />
    </>
  )
}
