import { useNavigate, useParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, EmptyState, PageHeader, PageSpinner } from '@/ui'
import { BookForm } from './BookForm'
import { books } from './hooks'
import { toFormValues, toPayload } from './schema'
import strings from './strings'

export default function BookEdit() {
  const { id } = useParams()
  const t = useStrings(strings)
  const c = useCommon()
  const navigate = useNavigate()
  const { data: book, isLoading, isError, error, refetch } = books.useOne(id)
  const update = books.useUpdate()

  if (isLoading) return <PageSpinner />

  if (isError) {
    return error.status === 404 ? (
      <EmptyState icon={SearchX} title={t.notFoundTitle} description={c.itemNotFound} action={<Button to="/library">{t.title}</Button>} />
    ) : (
      <Alert tone="danger" title={c.loadFailed} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{c.retry}</Button>}>
        {errorText(error, c)}
      </Alert>
    )
  }

  const onSubmit = async (values) => {
    await update.mutateAsync({ id: book.id, data: toPayload(values) })
    navigate('/library')
  }

  return (
    <>
      <PageHeader title={t.editTitle} backTo="/library" backLabel={t.title} />
      <BookForm key={book.id} isEdit book={book} defaultValues={toFormValues(book)} onSubmit={onSubmit} saving={update.isPending} />
    </>
  )
}
