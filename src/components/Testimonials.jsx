import { useEffect, useState } from 'react'
import SectionHeader from './SectionHeader'
import { useLang } from '../i18n/LanguageContext'
import { api } from '../lib/api'
import { initials } from '../lib/visuals'

function Stars({ n = 5 }) {
  return (
    <div className="mb-3 flex gap-1" aria-label={`${n}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i < n ? '#C9A86A' : 'none'} stroke="#C9A86A" strokeWidth="1.5">
          <path d="M12 2 15 8l7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials() {
  const { t, pick } = useLang()
  const [data, setData] = useState(null)
  useEffect(() => { api.getTestimonials().then(setData).catch(() => {}) }, [])

  const list = (data ?? []).map((x) => ({ name: x.name, company: x.company, quote: pick(x, 'quote'), rating: x.rating, avatar: x.avatar }))
  if (!list.length) return null

  return (
    <section className="mx-auto max-w-site px-[26px] pb-[90px]">
      <SectionHeader kicker={t.testimonialsKick} title={t.testimonialsTitle} />
      <div data-grid3 className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {list.map((x, i) => (
          <div key={i} className="flex flex-col rounded-card border border-[var(--border)] bg-[var(--card-bg)] p-7">
            <Stars n={x.rating || 5} />
            <p className="mb-5 flex-1 text-[15px] leading-[1.8] text-soft">“{x.quote}”</p>
            <div className="flex items-center gap-3">
              {x.avatar
                ? <img src={x.avatar} alt={x.name} className="h-[42px] w-[42px] rounded-full object-cover" />
                : (
                  <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full font-poppins text-[14px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#6B4E8E,#9678BE)' }}>
                    {initials(x.name)}
                  </div>
                )}
              <div>
                <div className="text-[15px] font-semibold">{x.name}</div>
                {x.company && <div className="text-[13px] text-accent-light">{x.company}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
