import { useEffect, useState } from 'react'
import SectionHeader from './SectionHeader'
import { useLang } from '../i18n/LanguageContext'
import { api } from '../lib/api'

export default function FaqAccordion() {
  const { t, pick } = useLang()
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(0)
  useEffect(() => { api.getFaqs().then(setData).catch(() => {}) }, [])

  const list = data && data.length
    ? data.map((x) => ({ q: pick(x, 'question'), a: pick(x, 'answer') }))
    : t.faqs
  if (!list.length) return null

  return (
    <section className="mx-auto max-w-[820px] px-[26px] pb-[90px]">
      <SectionHeader kicker={t.faqKick} title={t.faqTitle} />
      <div className="flex flex-col gap-3">
        {list.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={i} className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card-bg)]">
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
              >
                <span className="text-[15.5px] font-semibold">{f.q}</span>
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9678BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .3s', flex: 'none' }}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {isOpen && <div className="px-5 pb-4 text-[14.5px] leading-[1.8] text-muted">{f.a}</div>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
