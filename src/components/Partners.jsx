import { useEffect, useState } from 'react'
import SectionHeader from './SectionHeader'
import { useLang } from '../i18n/LanguageContext'
import { api } from '../lib/api'
import { toHttpUrl } from '../lib/url'

const TILE =
  'flex h-[74px] min-w-[168px] items-center justify-center rounded-[16px] border px-7 ' +
  'transition-all duration-500 hover:-translate-y-1'

const TILE_STYLE = {
  borderColor: 'rgba(255,255,255,.07)',
  background: 'linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.012))',
}

function Tile({ partner }) {
  const inner = partner.logo
    ? <img src={partner.logo} alt={partner.name} className="max-h-[34px] w-auto opacity-70 transition-opacity duration-500 hover:opacity-100" />
    : <span className="whitespace-nowrap font-poppins text-[15px] font-semibold text-soft">{partner.name}</span>

  const href = toHttpUrl(partner.url)
  return href
    ? <a href={href} target="_blank" rel="noreferrer" className={TILE} style={TILE_STYLE}>{inner}</a>
    : <div className={TILE} style={TILE_STYLE}>{inner}</div>
}

export default function Partners() {
  const { t } = useLang()
  const [data, setData] = useState(null)
  useEffect(() => { api.getPartners().then(setData).catch(() => {}) }, [])

  const list = data ?? []
  if (!list.length) return null

  // Below this the strip fits on screen and scrolling it would be motion for its own sake.
  const scroll = list.length >= 5

  return (
    <section className="ngp-section">
      <SectionHeader kicker={t.partnersKick} title={t.partnersTitle} />

      {scroll ? (
        <div className="ngp-marquee">
          {/* Two identical runs: the track is translated by exactly -50%, which lands on the start
              of the second run, so the loop has no visible seam. The duplicate is hidden from
              assistive technology to avoid reading every partner twice. */}
          <div className="ngp-marquee-track">
            <div className="flex gap-3.5 pe-3.5">
              {list.map((p, i) => <Tile key={i} partner={p} />)}
            </div>
            <div className="flex gap-3.5 pe-3.5" aria-hidden="true">
              {list.map((p, i) => <Tile key={'dup' + i} partner={p} />)}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3.5">
          {list.map((p, i) => <Tile key={i} partner={p} />)}
        </div>
      )}
    </section>
  )
}
