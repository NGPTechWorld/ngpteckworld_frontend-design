import { useNavigate, useParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, EmptyState, PageHeader, PageSpinner } from '@/ui'
import { OfferForm } from './OfferForm'
import { offers } from './hooks'
import { toFormValues, toPayload } from './schema'
import strings from './strings'

export default function OfferEdit() {
  const { id } = useParams()
  const t = useStrings(strings)
  const c = useCommon()
  const navigate = useNavigate()
  const { data: offer, isLoading, isError, error, refetch } = offers.useOne(id)
  const update = offers.useUpdate()

  if (isLoading) return <PageSpinner />

  if (isError) {
    return error.status === 404 ? (
      <EmptyState icon={SearchX} title={t.notFoundTitle} description={c.itemNotFound} action={<Button to="/offers">{t.title}</Button>} />
    ) : (
      <Alert tone="danger" title={c.loadFailed} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{c.retry}</Button>}>
        {errorText(error, c)}
      </Alert>
    )
  }

  const onSubmit = async (values) => {
    await update.mutateAsync({ id: offer.id, data: toPayload(values) })
    navigate('/offers')
  }

  return (
    <>
      <PageHeader title={t.editTitle} backTo="/offers" backLabel={t.title} />
      <OfferForm key={offer.id} isEdit offer={offer} defaultValues={toFormValues(offer)} onSubmit={onSubmit} saving={update.isPending} />
    </>
  )
}
