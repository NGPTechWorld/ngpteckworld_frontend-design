import { useNavigate } from 'react-router-dom'
import { useStrings } from '@/i18n'
import { PageHeader } from '@/ui'
import { OfferForm } from './OfferForm'
import { offers } from './hooks'
import { toPayload } from './schema'
import strings from './strings'

export default function OfferCreate() {
  const t = useStrings(strings)
  const navigate = useNavigate()
  const create = offers.useCreate()

  const onSubmit = async (values) => {
    await create.mutateAsync(toPayload(values))
    navigate('/offers')
  }

  return (
    <>
      <PageHeader title={t.createTitle} backTo="/offers" backLabel={t.title} />
      <OfferForm onSubmit={onSubmit} saving={create.isPending} />
    </>
  )
}
