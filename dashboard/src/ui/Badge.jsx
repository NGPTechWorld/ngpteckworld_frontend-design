import { useCommon } from '@/i18n'
import { cx } from '@/lib/cx'

const tones = {
  neutral: 'bg-white/10 text-soft',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-info/15 text-info',
  accent: 'bg-accent/30 text-accent-lighter',
  gold: 'bg-gold/15 text-gold',
}

/** Small pill: <Badge tone="success|danger|warning|info|accent|gold|neutral" dot>text</Badge> */
export function Badge({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>
      {dot ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}

const statusTones = {
  active: 'success',
  inactive: 'neutral',
  new: 'info',
  in_progress: 'warning',
  done: 'success',
  completed: 'success',
  draft: 'neutral',
}

/**
 * Status pill with built-in colours + localized labels for: active, inactive, new, in_progress, done, completed, draft.
 *   <StatusBadge status="new" />  ·  <StatusBadge active={row.is_active} />
 * Extra / custom statuses: `statuses={{ archived: { tone: 'warning', label: 'Archived' } }}`.
 */
export function StatusBadge({ status, active, statuses, className }) {
  const c = useCommon()
  const key = active === undefined ? status : active ? 'active' : 'inactive'
  const custom = statuses?.[key]
  const tone = custom?.tone ?? statusTones[key] ?? 'neutral'
  const label = custom?.label ?? c.statusLabels[key] ?? String(key ?? '—')
  return (
    <Badge tone={tone} dot className={className}>
      {label}
    </Badge>
  )
}
