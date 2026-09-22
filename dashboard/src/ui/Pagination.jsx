import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useCommon, useFormat } from '@/i18n'
import { cx } from '@/lib/cx'
import { Select } from './Select'
import { flipRtl, focusRing } from './styles'

/** [1, '…', 4, 5, 6, '…', 20] — always the first, last and a window around the current page. */
export function pageWindow(current, last, siblings = 1) {
  const pages = new Set([1, last, current])
  for (let i = 1; i <= siblings; i++) {
    pages.add(current - i)
    pages.add(current + i)
  }
  const sorted = [...pages].filter((page) => page >= 1 && page <= last).sort((a, b) => a - b)
  const out = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) out.push(page - sorted[index - 1] === 2 ? page - 1 : '…')
    out.push(page)
  })
  return out
}

function PageButton({ children, active, disabled, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        focusRing,
        active ? 'bg-accent text-white' : 'text-muted hover:bg-white/[.09] hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

/**
 * Pager for Laravel's paginator `meta` (`{ current_page, last_page, per_page, total, from?, to? }`):
 *   <Pagination meta={meta} onPageChange={setPage} onPerPageChange={setPerPage} perPageOptions={[15, 30, 60]} />
 * Renders nothing without `meta` / rows. If the requested page no longer exists (e.g. the last row of the last page
 * was deleted) it calls onPageChange(last_page) by itself.
 */
export function Pagination({ meta, onPageChange, onPerPageChange, perPageOptions = [15, 30, 50, 100], className }) {
  const c = useCommon()
  const f = useFormat()
  const current = meta?.current_page ?? 1
  const last = meta?.last_page ?? 1

  useEffect(() => {
    if (meta && current > last && last >= 1) onPageChange?.(last)
  }, [meta, current, last, onPageChange])

  if (!meta || !meta.total || current > last) return null

  const perPage = meta.per_page ?? 15
  const from = meta.from ?? (current - 1) * perPage + 1
  const to = meta.to ?? Math.min(current * perPage, meta.total)
  const options = [...new Set([...perPageOptions, perPage])].sort((a, b) => a - b)

  return (
    <nav aria-label={c.paginationLabel} className={cx('flex flex-wrap items-center justify-between gap-3 py-2', className)}>
      <p className="text-[13px] text-muted">{c.paginationSummary(f.number(from), f.number(to), f.number(meta.total))}</p>

      <div className="flex flex-wrap items-center gap-3">
        {onPerPageChange ? (
          <Select
            aria-label={c.perPage}
            value={perPage}
            onChange={(event) => onPerPageChange(Number(event.target.value))}
            options={options.map((value) => ({ value, label: c.perPageOption(value) }))}
            wrapperClassName="w-36"
            className="!h-9 !py-1 text-[13px]"
          />
        ) : null}

        {last > 1 ? (
          <div className="flex items-center gap-1">
            <PageButton label={c.firstPage} disabled={current <= 1} onClick={() => onPageChange?.(1)}>
              <ChevronsLeft size={16} aria-hidden="true" className={flipRtl} />
            </PageButton>
            <PageButton label={c.previous} disabled={current <= 1} onClick={() => onPageChange?.(current - 1)}>
              <ChevronLeft size={16} aria-hidden="true" className={flipRtl} />
            </PageButton>
            {pageWindow(current, last).map((page, index) =>
              page === '…' ? (
                <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-faint">
                  …
                </span>
              ) : (
                <PageButton key={page} label={c.pageN(page)} active={page === current} onClick={() => onPageChange?.(page)}>
                  {f.number(page)}
                </PageButton>
              ),
            )}
            <PageButton label={c.next} disabled={current >= last} onClick={() => onPageChange?.(current + 1)}>
              <ChevronRight size={16} aria-hidden="true" className={flipRtl} />
            </PageButton>
            <PageButton label={c.lastPage} disabled={current >= last} onClick={() => onPageChange?.(last)}>
              <ChevronsRight size={16} aria-hidden="true" className={flipRtl} />
            </PageButton>
          </div>
        ) : null}
      </div>
    </nav>
  )
}
