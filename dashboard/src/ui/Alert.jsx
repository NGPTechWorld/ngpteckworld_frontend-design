import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cx } from '@/lib/cx'

const tones = {
  danger: { icon: XCircle, cls: 'border-danger/40 bg-danger/10 text-danger', role: 'alert' },
  warning: { icon: AlertTriangle, cls: 'border-warning/40 bg-warning/10 text-warning', role: 'alert' },
  success: { icon: CheckCircle2, cls: 'border-success/40 bg-success/10 text-success', role: 'status' },
  info: { icon: Info, cls: 'border-info/40 bg-info/10 text-info', role: 'status' },
}

/**
 * Inline message banner. `action` renders a node (e.g. a retry <Button size="sm">) at the end.
 *   <Alert tone="danger" title="Could not load" action={<Button size="sm" onClick={refetch}>Retry</Button>}>message</Alert>
 */
export function Alert({ tone = 'info', title, action, className, children }) {
  const { icon: Icon, cls, role } = tones[tone]
  return (
    <div role={role} className={cx('flex items-start gap-3 rounded-xl border px-4 py-3', cls, className)}>
      <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 text-sm">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cx('text-ink/90', title && 'mt-0.5')}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
