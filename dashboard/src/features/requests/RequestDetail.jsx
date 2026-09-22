import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Mail, Phone, SearchX, Trash2 } from 'lucide-react'
import { useCommon, useFormat, useLanguage, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, Card, EmptyState, Field, PageHeader, PageSpinner, Select, StatusBadge, useConfirm } from '@/ui'
import { NotesForm } from './NotesForm'
import { statusOptions } from './constants'
import { requests, useDeleteRequest, useUpdateRequest } from './hooks'
import strings from './strings'

const linkClass = 'inline-flex items-center gap-1.5 break-all rounded text-accent-lighter underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light'

function Row({ label, children }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  )
}

export default function RequestDetail() {
  const { id } = useParams()
  const t = useStrings(strings)
  const c = useCommon()
  const f = useFormat()
  const { pickField } = useLanguage()
  const confirm = useConfirm()
  const navigate = useNavigate()

  const remove = useDeleteRequest()
  // once it is deleted the record must not be re-fetched (it would 404 before we have navigated away)
  const { data: request, isLoading, isError, error, refetch } = requests.useOne(id, { enabled: !remove.isSuccess })
  const update = useUpdateRequest()
  const options = useMemo(() => statusOptions(c), [c])

  if (isLoading) return <PageSpinner />

  if (isError) {
    return error.status === 404 ? (
      <EmptyState icon={SearchX} title={t.notFoundTitle} description={c.itemNotFound} action={<Button to="/requests">{t.title}</Button>} />
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

  if (!request) return <PageSpinner />

  const status = update.isPending && update.variables?.data?.status ? update.variables.data.status : request.status

  const onDelete = async () => {
    const ok = await confirm({ title: t.deleteTitle, message: t.deleteMessage(request.name), confirmLabel: c.delete })
    if (!ok) return
    try {
      await remove.mutateAsync(request.id)
      navigate('/requests', { replace: true })
    } catch {
      /* the crud hook already toasted the failure */
    }
  }

  return (
    <>
      <PageHeader
        title={request.name}
        backTo="/requests"
        backLabel={t.title}
        actions={
          <>
            <Button variant="secondary" icon={Mail} href={`mailto:${request.email}`}>
              {t.reply}
            </Button>
            <Button variant="danger" icon={Trash2} loading={remove.isPending} onClick={onDelete}>
              {c.delete}
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <Card title={request.title || t.messageTitle}>
            <p dir="auto" className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
              {request.description}
            </p>
          </Card>
          <NotesForm key={request.id} request={request} />
        </div>

        <Card title={t.detailsTitle} className="min-w-0 self-start">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/[.07] pb-4">
            <StatusBadge status={request.status} />
          </div>
          <Field label={c.status} hint={t.statusHint} className="mb-4">
            <Select value={status} disabled={update.isPending} options={options} onChange={(event) => update.mutate({ id: request.id, data: { status: event.target.value } })} />
          </Field>

          <dl className="divide-y divide-white/[.06] border-t border-white/[.07] pt-4">
            <Row label={t.service}>
              {request.service ? <span>{pickField(request.service, 'title')}</span> : <span className="text-faint">{t.notProvided}</span>}
            </Row>
            <Row label={t.name}>
              <span dir="auto">{request.name}</span>
            </Row>
            <Row label={t.email}>
              <a href={`mailto:${request.email}`} dir="ltr" className={linkClass}>
                <Mail size={14} aria-hidden="true" />
                {request.email}
              </a>
            </Row>
            <Row label={t.phone}>
              {request.phone ? (
                <a href={`tel:${request.phone.replace(/[^\d+]/g, '')}`} dir="ltr" className={linkClass}>
                  <Phone size={14} aria-hidden="true" />
                  {request.phone}
                </a>
              ) : (
                <span className="text-faint">{t.notProvided}</span>
              )}
            </Row>
            <Row label={t.receivedAt}>
              <time dateTime={request.created_at}>{f.dateTime(request.created_at)}</time>
            </Row>
            {request.updated_at && request.updated_at !== request.created_at ? (
              <Row label={c.updatedAt}>
                <time dateTime={request.updated_at}>{f.dateTime(request.updated_at)}</time>
              </Row>
            ) : null}
          </dl>
        </Card>
      </div>
    </>
  )
}
