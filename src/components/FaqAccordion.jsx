import { useEffect, useRef, useState } from 'react'
import SectionHeader from './SectionHeader'
import { useLang } from '../i18n/LanguageContext'
import { api } from '../lib/api'
import { Skeleton } from './fx/Skeleton'

function Row({ item, isOpen, onToggle }) {
  const bodyRef = useRef(null)
  // Animating to a measured pixel height rather than toggling display: `height: auto` is not an
  // animatable value, so an accordion that mounts and unmounts its body snaps open instead of
  // sliding. Measured in an effect rather than during render — the ref is still null on the first
  // pass, and a value read during render would never update when the text changes.
  const [height, setHeight] = useState(0)

  useEffect(() => {
    setHeight(isOpen ? bodyRef.current?.scrollHeight ?? 0 : 0)
  }, [isOpen, item.a, item.q])

  return (
    <div data-rise className="ngp-card ngp-card--flat !rounded-[16px]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start sm:px-6 sm:py-5"
      >
        <span className="text-[clamp(14.5px,2.2vw,16px)] font-semibold leading-snug">{item.q}</span>
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all duration-300"
          style={{
            borderColor: isOpen ? 'rgba(150,120,190,.55)' : 'rgba(255,255,255,.12)',
            background: isOpen ? 'rgba(107,78,142,.3)' : 'transparent',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C5B2E0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      <div
        style={{ height, overflow: 'hidden', transition: 'height .38s cubic-bezier(.22,.75,.25,1)' }}
      >
        <div ref={bodyRef} className="px-5 pb-5 text-[14.5px] leading-[1.85] text-muted sm:px-6">
          {item.a}
        </div>
      </div>
    </div>
  )
}

export default function FaqAccordion() {
  const { t, pick } = useLang()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(0)

  useEffect(() => {
    api.getFaqs().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const list = (data ?? []).map((x) => ({ q: pick(x, 'question'), a: pick(x, 'answer') }))
  if (!loading && !list.length) return null

  return (
    <section className="ngp-section" style={{ maxWidth: 860 }}>
      <SectionHeader kicker={t.faqKick} title={t.faqTitle} />
      <div data-stagger className="flex flex-col gap-3">
        {loading
          ? Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="ngp-card ngp-card--flat !rounded-[16px] px-6 py-5" aria-hidden="true">
              <Skeleton className="h-[16px] w-3/5" />
            </div>
          ))
          : list.map((f, i) => (
            <Row key={i} item={f} isOpen={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
      </div>
    </section>
  )
}
