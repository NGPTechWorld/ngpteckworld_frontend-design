import { useState } from 'react'
import { CalendarCheck, Minus, Plus } from 'lucide-react'
import { useCommon, useFormat, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { Badge, Button, Card, Field, IconButton, Input } from '@/ui'
import { offerRequests } from './hooks'
import strings from './strings'
import { daysUntil, expiryOf, today } from './subscription'

/** "12 days left" / "Ends today" / "Ended 3 days ago", coloured by how close the end is. */
export function RemainingBadge({ expiresAt }) {
  const t = useStrings(strings)
  const left = daysUntil(expiresAt)
  if (left === null) return null
  const tone = left < 0 ? 'danger' : left <= 7 ? 'warning' : 'success'
  return <Badge tone={tone}>{left < 0 ? t.endedAgo(-left) : left === 0 ? t.endsToday : t.daysLeft(left)}</Badge>
}

/**
 * The subscription of one request: how many days it runs (copied from the chosen plan, adjustable) and the day
 * it was accepted; the end date and the days left follow from both. Mount with `key={request.id}`.
 */
export function SubscriptionCard({ request }) {
  const t = useStrings(strings)
  const c = useCommon()
  const f = useFormat()
  const update = offerRequests.useUpdate()
  const [days, setDays] = useState(request.duration_days ?? '')
  const [acceptedAt, setAcceptedAt] = useState(request.accepted_at ?? '')
  const [errors, setErrors] = useState({})

  const expiresAt = expiryOf(acceptedAt, days)
  const dirty = String(days) !== String(request.duration_days ?? '') || acceptedAt !== (request.accepted_at ?? '')
  const step = (delta) => setDays(String(Math.min(3650, Math.max(1, (Number(days) || 0) + delta))))

  const save = async (patch) => {
    setErrors({})
    const payload = {
      duration_days: days === '' ? null : Number(days),
      accepted_at: acceptedAt || null,
      ...patch,
    }
    try {
      const saved = await update.mutateAsync({ id: request.id, data: payload })
      setDays(saved?.duration_days ?? payload.duration_days ?? '')
      setAcceptedAt(saved?.accepted_at ?? payload.accepted_at ?? '')
    } catch (err) {
      // show the API's messages under the two fields (other failures were toasted by the crud hook)
      const collected = {}
      applyServerErrors((name, error) => { collected[name] = error.message }, err)
      setErrors(collected)
    }
  }

  const acceptToday = () => {
    const day = today()
    setAcceptedAt(day)
    save({ accepted_at: day })
  }

  return (
    <Card title={t.subscriptionTitle} description={t.subscriptionHint}>
      <div className="space-y-5">
        <Field label={t.durationDays} hint={t.durationDaysHint} error={errors.duration_days}>
          <div className="flex flex-wrap items-center gap-2">
            <IconButton icon={Minus} label={t.durationLess} onClick={() => step(-1)} disabled={!days || Number(days) <= 1} />
            <Input type="number" inputMode="numeric" min={1} max={3650} dir="ltr" className="!w-28 text-center" value={days} onChange={(e) => setDays(e.target.value)} />
            <IconButton icon={Plus} label={t.durationMore} onClick={() => step(1)} disabled={Number(days) >= 3650} />
            <span className="text-sm text-muted">{t.days}</span>
          </div>
        </Field>

        <div className="grid items-end gap-4 sm:grid-cols-2">
          <Field label={t.acceptedAt} error={errors.accepted_at}>
            <Input type="date" dir="ltr" value={acceptedAt} onChange={(e) => setAcceptedAt(e.target.value)} />
          </Field>
          {request.accepted_at ? null : (
            <Button variant="secondary" icon={CalendarCheck} onClick={acceptToday} loading={update.isPending} className="mb-0.5">
              {t.acceptToday}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[.08] bg-white/[.02] px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-muted">{t.expiresAt}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{expiresAt ? f.date(`${expiresAt}T12:00:00`) : <span className="font-normal text-faint">{t.expiresUnknown}</span>}</p>
          </div>
          <RemainingBadge expiresAt={expiresAt} />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => save({})} disabled={!dirty} loading={update.isPending}>
            {update.isPending ? c.saving : t.saveSubscription}
          </Button>
        </div>
      </div>
    </Card>
  )
}
