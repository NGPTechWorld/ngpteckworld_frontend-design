import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'

const inputCls = 'w-full rounded-[11px] border border-white/[.14] px-4 py-3 text-[14.5px] text-white outline-none'
const inputStyle = { background: 'rgba(26,15,38,.6)' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+\d][\d\s().-]*$/
const phoneDigitCount = (v) => (v.match(/\d/g) || []).length

function validate(form, type, t) {
  const errors = {}
  if (!form.name.trim()) errors.name = t.errRequired
  if (!form.phone.trim()) errors.phone = t.errRequired
  else if (!PHONE_RE.test(form.phone.trim()) || phoneDigitCount(form.phone) < 7) errors.phone = t.errPhoneInvalid
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errors.email = t.errEmailInvalid
  if (type === 'inquiry' && !form.message.trim()) errors.message = t.errRequired
  return errors
}

function FieldError({ id, text }) {
  if (!text) return null
  return <p id={id} className="mt-1.5 text-[12.5px]" style={{ color: '#F3B4B4' }}>{text}</p>
}

/**
 * The booking / inquiry form of one offer, in a dialog. `type` is "booking" or "inquiry"; `plan` preselects a
 * plan (by its name in the current language) when the visitor clicked "Choose this plan". Sent to
 * POST /api/offers/{slug}/requests — a separate inbox (and Telegram message) from the contact form.
 */
export default function OfferRequestModal({ offer, type, plan = '', onClose }) {
  const { t, pick } = useLang()
  const plans = offer.plans ?? []
  const [form, setForm] = useState({ plan, name: '', phone: '', email: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const booking = type === 'booking'
  const title = pick(offer, 'title')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setFieldErrors((errs) => (errs[key] ? { ...errs, [key]: undefined } : errs))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    setError('')
    const errors = validate(form, type, t)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setBusy(true)
    try {
      await api.postOfferRequest(offer.slug, {
        type,
        plan: booking && form.plan ? form.plan : null,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        message: form.message.trim() || null,
      })
      setDone(true)
    } catch (err) {
      if (err.status === 422 && err.body?.errors) {
        const mapped = {}
        for (const [field, msgs] of Object.entries(err.body.errors)) mapped[field] = Array.isArray(msgs) ? msgs[0] : String(msgs)
        setFieldErrors(mapped)
      } else {
        setError(err.status === 429 ? t.errThrottle : t.errGeneric)
      }
    } finally {
      setBusy(false)
    }
  }

  const field = (key, label, input) => (
    <div>
      <label htmlFor={`offer-${key}`} className="mb-1.5 block text-[13px] text-soft">{label}</label>
      {input}
      <FieldError id={`offer-${key}-error`} text={fieldErrors[key]} />
    </div>
  )
  const aria = (key) => ({ id: `offer-${key}`, 'aria-invalid': Boolean(fieldErrors[key]), 'aria-describedby': fieldErrors[key] ? `offer-${key}-error` : undefined })

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${booking ? t.oFormBook : t.oAsk}: ${title}`}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-5"
      style={{ background: 'rgba(10,6,16,.88)', backdropFilter: 'blur(6px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] rounded-2xl border border-white/[.12] p-7"
        style={{ background: 'linear-gradient(180deg,#241636,#1A0F26)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="mb-1 font-mono text-[12.5px] text-accent-light">{booking ? t.oFormBook : t.oAsk}</div>
        <h2 className="mb-5 text-[22px] font-bold" dir="auto">{title}</h2>

        {done ? (
          <div role="status" className="text-center">
            <p className="mb-6 text-[16px] leading-relaxed text-soft">{booking ? t.oSentBooking : t.oSentInquiry}</p>
            <button type="button" onClick={onClose} className="btn-p rounded-xl bg-accent px-7 py-3 font-semibold text-white">{t.oClose}</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {booking && plans.length > 0 && field('plan', t.oPlanLabel, (
              <select {...aria('plan')} value={form.plan} onChange={set('plan')} className={inputCls} style={inputStyle}>
                <option value="">{t.oPlanNone}</option>
                {plans.map((p, i) => <option key={i} value={pick(p, 'name')}>{pick(p, 'name')}</option>)}
              </select>
            ))}
            {field('name', t.fName, <input {...aria('name')} value={form.name} onChange={set('name')} maxLength={120} autoComplete="name" className={inputCls} style={inputStyle} />)}
            {field('phone', t.fPhone, <input {...aria('phone')} value={form.phone} onChange={set('phone')} maxLength={40} type="tel" dir="ltr" autoComplete="tel" className={inputCls} style={inputStyle} />)}
            {field('email', t.fEmail, <input {...aria('email')} value={form.email} onChange={set('email')} maxLength={160} type="email" dir="ltr" autoComplete="email" className={inputCls} style={inputStyle} />)}
            {field('message', booking ? t.oNote : t.oQuestion, (
              <textarea {...aria('message')} value={form.message} onChange={set('message')} maxLength={3000} rows={4} dir="auto" className={`${inputCls} resize-y`} style={inputStyle} />
            ))}
            {error && <p role="alert" className="text-[13.5px]" style={{ color: '#F3B4B4' }}>{error}</p>}
            <div className="mt-1 flex flex-wrap gap-3">
              <button type="submit" disabled={busy} className="btn-p flex-1 rounded-xl bg-accent px-6 py-3.5 font-semibold text-white disabled:opacity-60">
                {busy ? t.sending : t.submit}
              </button>
              <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-6 py-3.5 font-semibold text-soft">{t.oClose}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
