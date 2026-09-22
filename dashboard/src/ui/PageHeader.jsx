import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCommon } from '@/i18n'
import { cx } from '@/lib/cx'
import { flipRtl } from './styles'

const SUFFIX = 'NGP Dashboard'

/**
 * Page title row: <PageHeader title description actions={<Button/>} backTo="/faqs" />.
 * A string `title` also becomes document.title. `backTo` shows a back link (arrow mirrors in RTL).
 */
export function PageHeader({ title, description, actions, backTo, backLabel, className }) {
  const c = useCommon()

  useEffect(() => {
    if (typeof title === 'string' && title) document.title = `${title} · ${SUFFIX}`
  }, [title])

  return (
    <header className={cx('mb-6 flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {backTo ? (
          <Link to={backTo} className="mb-2 inline-flex items-center gap-1.5 rounded-md text-[13px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light">
            <ArrowLeft size={14} aria-hidden="true" className={flipRtl} />
            {backLabel ?? c.back}
          </Link>
        ) : null}
        <h1 className="text-2xl font-extrabold leading-tight text-ink sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
