import { useEffect, useState } from 'react'
import SectionHeader from './SectionHeader'
import { useLang } from '../i18n/LanguageContext'
import { api } from '../lib/api'

export default function Partners() {
  const { t } = useLang()
  const [data, setData] = useState(null)
  useEffect(() => { api.getPartners().then(setData).catch(() => {}) }, [])

  const list = data && data.length ? data : t.partners
  if (!list.length) return null

  return (
    <section className="mx-auto max-w-site px-[26px] pb-[90px]">
      <SectionHeader kicker={t.partnersKick} title={t.partnersTitle} />
      <div className="flex flex-wrap items-center justify-center gap-3.5">
        {list.map((p, i) => (
          <div
            key={i}
            className="flex h-[64px] min-w-[150px] items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--card-bg)] px-6 transition-colors hover:border-[var(--border-accent)]"
          >
            {p.logo
              ? <img src={p.logo} alt={p.name} className="max-h-[34px] w-auto opacity-80" />
              : <span className="font-poppins text-[15px] font-semibold text-soft">{p.name}</span>}
          </div>
        ))}
      </div>
    </section>
  )
}
