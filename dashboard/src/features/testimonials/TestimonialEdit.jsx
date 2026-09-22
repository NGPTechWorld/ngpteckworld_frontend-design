import { useNavigate, useParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, EmptyState, PageHeader, PageSpinner } from '@/ui'
import { TestimonialForm } from './TestimonialForm'
import { testimonials } from './hooks'
import { toFormValues, toPayload } from './schema'
import strings from './strings'

export default function TestimonialEdit() {
  const { id } = useParams()
  const t = useStrings(strings)
  const c = useCommon()
  const navigate = useNavigate()
  const { data: testimonial, isLoading, isError, error, refetch } = testimonials.useOne(id)
  const update = testimonials.useUpdate()

  if (isLoading) return <PageSpinner />

  if (isError) {
    return error.status === 404 ? (
      <EmptyState icon={SearchX} title={t.notFoundTitle} description={c.itemNotFound} action={<Button to="/testimonials">{t.title}</Button>} />
    ) : (
      <Alert tone="danger" title={c.loadFailed} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{c.retry}</Button>}>
        {errorText(error, c)}
      </Alert>
    )
  }

  const onSubmit = async (values) => {
    await update.mutateAsync({ id: testimonial.id, data: toPayload(values) })
    navigate('/testimonials')
  }

  return (
    <>
      <PageHeader title={t.editTitle} backTo="/testimonials" backLabel={t.title} />
      <TestimonialForm key={testimonial.id} isEdit defaultValues={toFormValues(testimonial)} avatarUrl={testimonial.avatar_url} onSubmit={onSubmit} saving={update.isPending} />
    </>
  )
}
