import { useNavigate, useParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useAuth } from '@/app/AuthProvider'
import { useCommon, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, EmptyState, PageHeader, PageSpinner } from '@/ui'
import { UserForm } from './UserForm'
import { users } from './hooks'
import { toFormValues } from './schema'
import strings from './strings'

export default function UserEdit() {
  const { id } = useParams()
  const t = useStrings(strings)
  const c = useCommon()
  const navigate = useNavigate()
  const { user: me, updateUser } = useAuth()
  const { data: user, isLoading, isError, error, refetch } = users.useOne(id)
  const update = users.useUpdate()

  if (isLoading) return <PageSpinner />

  if (isError) {
    return error.status === 404 ? (
      <EmptyState icon={SearchX} title={t.notFoundTitle} description={c.itemNotFound} action={<Button to="/users">{t.title}</Button>} />
    ) : (
      <Alert
        tone="danger"
        title={c.loadFailed}
        action={
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            {c.retry}
          </Button>
        }
      >
        {errorText(error, c)}
      </Alert>
    )
  }

  const onSubmit = async (payload) => {
    const saved = await update.mutateAsync({ id: user.id, data: payload })
    // editing your own record: the top bar must show the new name / email
    if (me && saved?.id === me.id) updateUser({ name: saved.name, email: saved.email })
    navigate('/users')
  }

  return (
    <>
      <PageHeader title={t.editTitle} backTo="/users" backLabel={t.title} />
      <UserForm key={user.id} isEdit defaultValues={toFormValues(user)} onSubmit={onSubmit} saving={update.isPending} />
    </>
  )
}
