import { useNavigate } from 'react-router-dom'
import { useStrings } from '@/i18n'
import { PageHeader } from '@/ui'
import { team } from './hooks'
import { toPayload } from './schema'
import strings from './strings'
import { TeamForm } from './TeamForm'

export default function TeamCreate() {
  const t = useStrings(strings)
  const navigate = useNavigate()
  const create = team.useCreate()

  const onSubmit = async (values) => {
    await create.mutateAsync(toPayload(values))
    navigate('/team')
  }

  return (
    <>
      <PageHeader title={t.createTitle} backTo="/team" backLabel={t.title} />
      <TeamForm onSubmit={onSubmit} saving={create.isPending} />
    </>
  )
}
