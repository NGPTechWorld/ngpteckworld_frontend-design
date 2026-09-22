import { useNavigate, useParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, EmptyState, PageHeader, PageSpinner } from '@/ui'
import { FaqForm } from './FaqForm'
import { faqs } from './hooks'
import { toFormValues } from './schema'
import strings from './strings'

export default function FaqEdit() {
  const { id } = useParams()
  const t = useStrings(strings)
  const c = useCommon()
  const navigate = useNavigate()
  const { data: faq, isLoading, isError, error, refetch } = faqs.useOne(id)
  const update = faqs.useUpdate()

  if (isLoading) return <PageSpinner />

  if (isError) {
    return error.status === 404 ? (
      <EmptyState icon={SearchX} title={t.notFoundTitle} description={c.itemNotFound} action={<Button to="/faqs">{t.title}</Button>} />
    ) : (
      <Alert tone="danger" title={c.loadFailed} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{c.retry}</Button>}>
        {errorText(error, c)}
      </Alert>
    )
  }

  const onSubmit = async (values) => {
    await update.mutateAsync({ id: faq.id, data: values })
    navigate('/faqs')
  }

  return (
    <>
      <PageHeader title={t.editTitle} backTo="/faqs" backLabel={t.title} />
      <FaqForm key={faq.id} isEdit defaultValues={toFormValues(faq)} onSubmit={onSubmit} saving={update.isPending} />
    </>
  )
}
