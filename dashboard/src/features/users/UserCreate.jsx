import { useNavigate } from 'react-router-dom'
import { useStrings } from '@/i18n'
import { PageHeader } from '@/ui'
import { UserForm } from './UserForm'
import { users } from './hooks'
import strings from './strings'

export default function UserCreate() {
  const t = useStrings(strings)
  const navigate = useNavigate()
  const create = users.useCreate()

  const onSubmit = async (payload) => {
    await create.mutateAsync(payload)
    navigate('/users')
  }

  return (
    <>
      <PageHeader title={t.createTitle} backTo="/users" backLabel={t.title} />
      <UserForm onSubmit={onSubmit} saving={create.isPending} />
    </>
  )
}
