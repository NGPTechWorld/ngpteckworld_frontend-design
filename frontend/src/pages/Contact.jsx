import { useState } from 'react'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'
import Icon from '../components/Icon'
import PageTitle from '../components/PageTitle'

const inputCls = 'rounded-[11px] border border-white/[.14] px-4 py-3.5 text-[14.5px] text-white outline-none'
const inputStyle = { background: 'rgba(26,15,38,.6)' }

export default function Contact() {
  const { t } = useLang()
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.postContact(form)
      setSent(true)
      setForm({ name: '', phone: '', email: '', message: '' })
      setTimeout(() => setSent(false), 2600)
    } catch { /* keep form */ } finally { setBusy(false) }
  }

  return (
    <div className="view-enter mx-auto max-w-[1100px] px-[26px] pb-[90px] pt-[70px]">
      <PageTitle title={t.contactTitle} />
      <div className="mb-[50px] text-center">
        <div className="mb-2.5 font-mono text-[13px] text-accent-light">// {t.navContact}</div>
        <h1 className="mb-3.5 text-[44px] font-extrabold">{t.contactTitle}</h1>
        <p className="mx-auto max-w-[540px] text-[17px] text-muted">{t.contactSub}</p>
      </div>

      <div data-grid2 className="grid gap-6" style={{ gridTemplateColumns: '.85fr 1.15fr' }}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--card-bg)] p-[18px]">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px]" style={{ background: 'rgba(107,78,142,.3)' }}>
              <Icon path='<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 6 10-6"/>' size={19} stroke="#9678BE" />
            </div>
            <div><div className="text-[12px] text-faint">{t.cEmail}</div><div className="text-[14.5px]" dir="ltr">info@ngptechworld.com</div></div>
          </div>
          <div className="flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--card-bg)] p-[18px]">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px]" style={{ background: 'rgba(107,78,142,.3)' }}>
              <Icon path='<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>' size={19} stroke="#9678BE" />
            </div>
            <div><div className="text-[12px] text-faint">{t.cPhone}</div><div className="text-[14.5px]" dir="ltr">+963 11 234 5678</div></div>
          </div>
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--card-bg)] p-[18px]">
            <div className="mb-3 text-[12px] text-faint">{t.cFollow}</div>
            <div className="flex flex-wrap gap-2.5">
              {t.companySocials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="glink rounded-full border border-white/[.14] bg-white/[.03] px-4 py-2 text-[13px] text-[#D8CEE6]">{s.label}</a>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3.5 rounded-card border border-[var(--border)] bg-[var(--card-bg)] p-[30px]">
          <div data-grid2 className="grid gap-3.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <input required placeholder={t.fName} value={form.name} onChange={set('name')} className={inputCls} style={inputStyle} />
            <input required placeholder={t.fPhone} value={form.phone} onChange={set('phone')} dir="ltr" className={inputCls} style={{ ...inputStyle, textAlign: 'start' }} />
          </div>
          <input required type="email" placeholder={t.fEmail} value={form.email} onChange={set('email')} dir="ltr" className={inputCls} style={{ ...inputStyle, textAlign: 'start' }} />
          <textarea required rows={5} placeholder={t.fMsg} value={form.message} onChange={set('message')} className={`${inputCls} resize-y`} style={inputStyle} />
          <button type="submit" disabled={busy} className="btn-p rounded-[11px] border-none bg-accent py-[15px] text-[15px] font-semibold text-white">
            {sent ? t.sent : t.submit}
          </button>
        </form>
      </div>
    </div>
  )
}
