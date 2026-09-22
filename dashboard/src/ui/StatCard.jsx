import { Link } from 'react-router-dom'
import { cx } from '@/lib/cx'
import { focusRing } from './styles'

const tones = {
  accent: 'bg-accent/25 text-accent-lighter',
  gold: 'bg-gold/15 text-gold',
  success: 'bg-success/15 text-success',
  info: 'bg-info/15 text-info',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
}

/** KPI tile: <StatCard label="New requests" value={12} icon={Inbox} tone="gold" to="/requests?status=new" hint="+3 today" /> */
export function StatCard({ label, value, icon: Icon, tone = 'accent', to, hint, className }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-muted">{label}</p>
        {Icon ? (
          <span aria-hidden="true" className={cx('inline-flex size-9 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-poppins text-3xl font-bold tabular-nums text-ink">{value ?? '—'}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </>
  )
  const cls = cx('block rounded-card border border-white/[.08] bg-white/[.03] p-5 shadow-card', to && ['transition-colors hover:border-accent-light/50 hover:bg-white/[.05]', focusRing], className)
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}
