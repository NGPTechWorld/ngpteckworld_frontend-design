import { useNavigate } from 'react-router-dom'
import { useStrings } from '@/i18n'
import { PageHeader } from '@/ui'
import { BookForm } from './BookForm'
import { books } from './hooks'
import { toPayload } from './schema'
import strings from './strings'

export default function BookCreate() {
  const t = useStrings(strings)
  const navigate = useNavigate()
  const create = books.useCreate()

  const onSubmit = async (values) => {
    await create.mutateAsync(toPayload(values))
    navigate('/library')
  }

  return (
    <>
      <PageHeader title={t.createTitle} backTo="/library" backLabel={t.title} />
      <BookForm onSubmit={onSubmit} saving={create.isPending} />
    </>
  )
}
