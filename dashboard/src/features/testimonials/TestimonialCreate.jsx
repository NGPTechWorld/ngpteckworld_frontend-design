import { useNavigate } from 'react-router-dom'
import { useStrings } from '@/i18n'
import { PageHeader } from '@/ui'
import { TestimonialForm } from './TestimonialForm'
import { testimonials } from './hooks'
import { toPayload } from './schema'
import strings from './strings'

export default function TestimonialCreate() {
  const t = useStrings(strings)
  const navigate = useNavigate()
  const create = testimonials.useCreate()

  const onSubmit = async (values) => {
    await create.mutateAsync(toPayload(values))
    navigate('/testimonials')
  }

  return (
    <>
      <PageHeader title={t.createTitle} backTo="/testimonials" backLabel={t.title} />
      <TestimonialForm onSubmit={onSubmit} saving={create.isPending} />
    </>
  )
}
