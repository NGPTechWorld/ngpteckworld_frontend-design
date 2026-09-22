import { cx } from '@/lib/cx'

/**
 * Surface container. With `title` it gets a header (`description`, `actions` on the end side); `padded={false}`
 * removes the body padding (tables, lists that touch the edges). `footer` sits in a bordered strip.
 */
export function Card({ title, description, actions, footer, padded = true, className, bodyClassName, children, as: Tag = 'section', ...rest }) {
  return (
    <Tag className={cx('rounded-card border border-white/[.08] bg-white/[.03] shadow-card', className)} {...rest}>
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[.07] px-5 py-4">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-bold text-ink">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cx(padded && 'p-5', bodyClassName)}>{children}</div>
      {footer ? <div className="border-t border-white/[.07] px-5 py-3.5">{footer}</div> : null}
    </Tag>
  )
}
