import { Inbox } from 'lucide-react'
import { cx } from '@/lib/cx'

/** "Nothing here" block: <EmptyState icon={Inbox} title description action={<Button>…</Button>} /> */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <span aria-hidden="true" className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-accent/20 text-accent-lighter">
        <Icon size={26} />
      </span>
      {title ? <h3 className="text-base font-bold text-ink">{title}</h3> : null}
      {description ? <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
