import { useEffect, useState } from 'react'
import SectionHeader from './SectionHeader'
import { useLang } from '../i18n/LanguageContext'
import { api } from '../lib/api'
import { initials } from '../lib/visuals'
import { useSpotlight } from '../lib/useSpotlight'
import { Skeleton } from './fx/Skeleton'
import SmartImage from './fx/SmartImage'

function Stars({ n = 5 }) {
  return (
    <div className="mb-4 flex gap-1" aria-label={`${n}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i < n ? '#C5B2E0' : 'none'} stroke="#9678BE" strokeWidth="1.5">
          <path d="M12 2 15 8l7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
        </svg>
      ))}
    </div>
  )
}

function Card({ item }) {
  const spot = useSpotlight()
  return (
    <div ref={spot} data-rise className="ngp-card flex h-full flex-col p-7">
      <span className="ngp-bracket ngp-bracket--tl" />
      <span className="ngp-bracket ngp-bracket--br" />

      {/* Oversized quote mark, cropped by the card — a graphic element rather than punctuation. */}
      <span
        className="pointer-events-none absolute -top-5 font-poppins text-[120px] leading-none text-white/[.04]"
        style={{ insetInlineEnd: '14px' }}
        aria-hidden="true"
      >
        &rdquo;
      </span>

      <Stars n={item.rating || 5} />
      <p className="mb-6 flex-1 text-[15px] leading-[1.8] text-soft">{item.quote}</p>

      <div className="flex items-center gap-3 border-t border-white/[.07] pt-5">
        {item.avatar
          ? <SmartImage src={item.avatar} className="h-[42px] w-[42px] shrink-0 rounded-full" />
          : (
            <div
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full font-poppins text-[14px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#6B4E8E,#9678BE)' }}
            >
              {initials(item.name)}
            </div>
          )}
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold">{item.name}</div>
          {item.company && <div className="truncate text-[13px] text-accent-light">{item.company}</div>}
        </div>
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="ngp-card flex h-full flex-col p-7" aria-hidden="true">
      <Skeleton className="mb-4 h-[15px] w-[90px]" />
      <Skeleton className="mb-2 h-[13px] w-full" />
      <Skeleton className="mb-2 h-[13px] w-full" />
      <Skeleton className="mb-6 h-[13px] w-2/3" />
      <div className="flex items-center gap-3 border-t border-white/[.07] pt-5">
        <Skeleton className="h-[42px] w-[42px] !rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-[13px] w-1/2" />
          <Skeleton className="h-[11px] w-1/3" />
        </div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  const { t, pick } = useLang()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getTestimonials()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const list = (data ?? []).map((x) => ({
    name: x.name, company: x.company, quote: pick(x, 'quote'), rating: x.rating, avatar: x.avatar,
  }))

  // Once loading has finished and there is genuinely nothing, drop the section rather than leave
  // a heading over empty space.
  if (!loading && !list.length) return null

  return (
    <section className="ngp-section">
      <SectionHeader kicker={t.testimonialsKick} title={t.testimonialsTitle} />
      <div data-stagger className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)
          : list.map((x, i) => <Card key={i} item={x} />)}
      </div>
    </section>
  )
}
