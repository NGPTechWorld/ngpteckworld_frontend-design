import { useNavigate } from 'react-router-dom'
import { useStrings } from '@/i18n'
import { PageHeader } from '@/ui'
import { FaqForm } from './FaqForm'
import { faqs } from './hooks'
import strings from './strings'

export default function FaqCreate() {
  const t = useStrings(strings)
  const navigate = useNavigate()
  const create = faqs.useCreate()

  const onSubmit = async (values) => {
    await create.mutateAsync(values)
    navigate('/faqs')
  }

  return (
    <>
      <PageHeader title={t.createTitle} backTo="/faqs" backLabel={t.title} />
      <FaqForm onSubmit={onSubmit} saving={create.isPending} />
    </>
  )
}
