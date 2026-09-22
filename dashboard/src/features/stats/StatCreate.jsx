import { useNavigate } from 'react-router-dom'
import { useStrings } from '@/i18n'
import { PageHeader } from '@/ui'
import { StatForm } from './StatForm'
import { stats } from './hooks'
import strings from './strings'

export default function StatCreate() {
  const t = useStrings(strings)
  const navigate = useNavigate()
  const create = stats.useCreate()

  const onSubmit = async (values) => {
    await create.mutateAsync(values)
    navigate('/stats')
  }

  return (
    <>
      <PageHeader title={t.createTitle} backTo="/stats" backLabel={t.title} />
      <StatForm onSubmit={onSubmit} saving={create.isPending} />
    </>
  )
}
