import { useEffect, useState } from 'react'
import SectionHeader from './SectionHeader'
import { useLang } from '../i18n/LanguageContext'
import { api } from '../lib/api'
import { toHttpUrl } from '../lib/url'

const tileCls = 'flex h-[64px] min-w-[150px] items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--card-bg)] px-6 transition-colors hover:border-[var(--border-accent)]'

export default function Partners() {
  const { t } = useLang()
  const [data, setData] = useState(null)
  useEffect(() => { api.getPartners().then(setData).catch(() => {}) }, [])

  const list = data ?? []
  if (!list.length) return null

  return (
    <section className="mx-auto max-w-site px-[26px] pb-[90px]">
      <SectionHeader kicker={t.partnersKick} title={t.partnersTitle} />
      <div className="flex flex-wrap items-center justify-center gap-3.5">
        {list.map((p, i) => {
          const inner = p.logo
            ? <img src={p.logo} alt={p.name} className="max-h-[34px] w-auto opacity-80" />
            : <span className="font-poppins text-[15px] font-semibold text-soft">{p.name}</span>
          // Partners with a website in the dashboard link out to it.
          const href = toHttpUrl(p.url)
          return href
            ? <a key={i} href={href} target="_blank" rel="noreferrer" className={tileCls}>{inner}</a>
            : <div key={i} className={tileCls}>{inner}</div>
        })}
      </div>
    </section>
  )
}
