import { Loader2 } from 'lucide-react'
import { useCommon } from '@/i18n'
import { cx } from '@/lib/cx'

/** Inline spinner. Decorative unless `label` is given (then it is announced). */
export function Spinner({ size = 18, label, className }) {
  return (
    <span role={label ? 'status' : undefined} className={cx('inline-flex items-center', className)}>
      <Loader2 size={size} aria-hidden="true" className="animate-spin" />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  )
}

/** Centered block for "the page is loading". */
export function PageSpinner({ className }) {
  const c = useCommon()
  return (
    <div className={cx('flex min-h-[40vh] items-center justify-center text-accent-lighter', className)}>
      <Spinner size={28} label={c.loading} />
    </div>
  )
}

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cx('animate-pulse rounded-lg bg-white/[.07]', className)} />
}
