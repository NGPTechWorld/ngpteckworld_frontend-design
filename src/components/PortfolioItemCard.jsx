import { useLang } from '../i18n/LanguageContext'
import Icon from './Icon'
import { dateRange } from '../lib/cv'
import SmartImage from './fx/SmartImage'

/** One card of a team member's portfolio grid — the same fixed template for every item, opens the
 * full item in a modal (see PortfolioItemModal) instead of navigating to a separate page. */
export default function PortfolioItemCard({ item, onOpen }) {
  const { pick, t } = useLang()
  const title = pick(item, 'title')
  const description = pick(item, 'description')
  const subtitle = pick(item, 'subtitle')
  const dates = dateRange(item.start_date, item.end_date, item.is_current, t.mPresent)

  const coverFallback = (
    <div className="absolute inset-0 grid place-items-center">
      <Icon path='<path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1zM9 5h6v2H9z"/>' size={32} stroke="#C5B2E0" />
    </div>
  )

  return (
    <button type="button" onClick={onOpen}
      className="card-lift block overflow-hidden rounded-card border border-[var(--border)] bg-[var(--card-bg)] text-start shadow-cardhover">
      <div className="relative flex items-center justify-center overflow-hidden" style={{ height: 160, background: 'linear-gradient(135deg,#6B4E8E,#301D3D)' }}>
        {item.cover_image ? (
          <SmartImage src={item.cover_image} className="absolute inset-0" fallback={coverFallback} />
        ) : coverFallback}
      </div>
      <div className="p-[18px]">
        <h4 className="mb-1 truncate text-[16px] font-semibold" dir="auto">{title}</h4>
        {subtitle && <p className="mb-1 truncate text-[13px] italic text-[#D8CEE6]" dir="auto">{subtitle}</p>}
        {dates && <p className="mb-1.5 text-[12.5px] text-faint" dir="ltr">{dates}</p>}
        <p className="line-clamp-2 text-[13.5px] leading-[1.6] text-muted" dir="auto">{description}</p>
      </div>
    </button>
  )
}
