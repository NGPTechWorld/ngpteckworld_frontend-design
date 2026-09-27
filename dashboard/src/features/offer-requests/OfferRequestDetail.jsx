import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Mail, MessageCircle, Phone, SearchX, Trash2 } from 'lucide-react'
import { useCommon, useFormat, useLanguage, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { Alert, Button, Card, EmptyState, Field, PageHeader, PageSpinner, Select, StatusBadge, useConfirm } from '@/ui'
import { statusOptions } from '@/features/requests/constants'
import { offerRequests } from './hooks'
import { NotesForm } from './NotesForm'
import { SubscriptionCard } from './SubscriptionCard'
import strings from './strings'
import { TypeBadge } from './TypeBadge'

const linkClass = 'inline-flex items-center gap-1.5 break-all rounded text-accent-lighter underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light'

function Row({ label, children }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  )
}

/** Digits only, for tel: / wa.me links ("+963 933 000 111" → "963933000111"). */
const digits = (phone) => String(phone ?? '').replace(/[^\d]/g, '')

export default function OfferRequestDetail() {
  const { id } = useParams()
  const t = useStrings(strings)
  const c = useCommon()
  const f = useFormat()
  const { pickField } = useLanguage()
  const confirm = useConfirm()
  const navigate = useNavigate()

  const remove = offerRequests.useDelete()
  // once it is deleted the record must not be re-fetched (it would 404 before we have navigated away)
  const { data: request, isLoading, isError, error, refetch } = offerRequests.useOne(id, { enabled: !remove.isSuccess })
  const update = offerRequests.useUpdate()
  const options = useMemo(() => statusOptions(c), [c])

  if (isLoading) return <PageSpinner />

  if (isError) {
    return error.status === 404 ? (
      <EmptyState icon={SearchX} title={t.notFoundTitle} description={c.itemNotFound} action={<Button to="/offer-requests">{t.title}</Button>} />
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
      navigate('/offer-requests', { replace: true })
    } catch {
      /* the crud hook already toasted the failure */
    }
  }

  return (
    <>
      <PageHeader
        title={request.name}
        backTo="/offer-requests"
        backLabel={t.title}
        actions={
          <>
            <Button variant="secondary" icon={Phone} href={`tel:+${digits(request.phone)}`}>
              {t.call}
            </Button>
            <Button variant="secondary" icon={MessageCircle} href={`https://wa.me/${digits(request.phone)}`} target="_blank" rel="noreferrer">
              {t.whatsapp}
            </Button>
            <Button variant="danger" icon={Trash2} loading={remove.isPending} onClick={onDelete}>
              {c.delete}
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <Card title={t.messageTitle[request.type] ?? t.messageTitle.booking}>
            {request.message ? (
              <p dir="auto" className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
                {request.message}
              </p>
            ) : (
              <p className="text-sm text-faint">{t.noMessage}</p>
            )}
          </Card>
          <SubscriptionCard key={`sub-${request.id}`} request={request} />
          <NotesForm key={request.id} request={request} />
        </div>

        <Card title={t.detailsTitle} className="min-w-0 self-start">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/[.07] pb-4">
            <TypeBadge type={request.type} />
            <StatusBadge status={request.status} />
          </div>
          <Field label={c.status} hint={t.statusHint} className="mb-4">
            <Select value={status} disabled={update.isPending} options={options} onChange={(event) => update.mutate({ id: request.id, data: { status: event.target.value } })} />
          </Field>

          <dl className="divide-y divide-white/[.06] border-t border-white/[.07] pt-4">
            <Row label={t.offer}>
              <span dir="auto">{request.offer ? pickField(request.offer, 'title') : `${request.offer_title} (${t.offerDeleted})`}</span>
            </Row>
            <Row label={t.plan}>
              {request.plan ? <span dir="auto">{request.plan}</span> : <span className="text-faint">{t.notProvided}</span>}
            </Row>
            <Row label={t.name}>
              <span dir="auto">{request.name}</span>
            </Row>
            <Row label={t.phone}>
              <a href={`tel:+${digits(request.phone)}`} dir="ltr" className={linkClass}>
                <Phone size={14} aria-hidden="true" />
                {request.phone}
              </a>
            </Row>
            <Row label={t.email}>
              {request.email ? (
                <a href={`mailto:${request.email}`} dir="ltr" className={linkClass}>
                  <Mail size={14} aria-hidden="true" />
                  {request.email}
                </a>
              ) : (
                <span className="text-faint">{t.notProvided}</span>
              )}
            </Row>
            <Row label={t.receivedAt}>
              <time dateTime={request.created_at}>{f.dateTime(request.created_at)}</time>
            </Row>
          </dl>
        </Card>
      </div>
    </>
  )
}
