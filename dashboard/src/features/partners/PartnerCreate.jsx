import { useNavigate } from 'react-router-dom'
import { useStrings } from '@/i18n'
import { PageHeader } from '@/ui'
import { PartnerForm } from './PartnerForm'
import { partners } from './hooks'
import { toPayload } from './schema'
import strings from './strings'

export default function PartnerCreate() {
  const t = useStrings(strings)
  const navigate = useNavigate()
  const create = partners.useCreate()

  const onSubmit = async (values) => {
    await create.mutateAsync(toPayload(values))
    navigate('/partners')
  }

  return (
    <>
      <PageHeader title={t.createTitle} backTo="/partners" backLabel={t.title} />
      <PartnerForm onSubmit={onSubmit} saving={create.isPending} />
    </>
  )
}
