import { useMemo, useState } from 'react'
import { BarChart3, Table2 } from 'lucide-react'
import { useFormat, useLanguage, useStrings } from '@/i18n'
import { cx } from '@/lib/cx'
import { Button, Card } from '@/ui'
import { barPath, niceMax, parseDay, summarize } from './chartMath'
import strings from './strings'

// The plot lives in a fixed viewBox and is stretched to the card: 10 units per day, 100 units of height.
const HEIGHT = 100
const SLOT = 10
const BAR = 5.5
const RADIUS = 1.6
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Requests per day (columns), one series so no legend: the card title names it and two figures label the total and
 * the busiest day. Dates run in reading direction (oldest at the start side: right in Arabic). Hover shows the value;
 * the same numbers are in the table view and in the `aria-label` summary, so nothing depends on the pointer.
 *
 * days = [{ date: 'YYYY-MM-DD', count }] oldest first (the API sends 30, zeros included).
 */
export function RequestsChart({ days, busy = false }) {
  const t = useStrings(strings)
  const f = useFormat()
  const { isAr } = useLanguage()
  const [active, setActive] = useState(null)
  const [tableView, setTableView] = useState(false)

  const count = days.length
  const { total, peak } = useMemo(() => summarize(days), [days])
  const top = useMemo(() => niceMax(Math.max(0, ...days.map((day) => day.count))), [days])

  if (count === 0) return null

  const slotOf = (index) => (isAr ? count - 1 - index : index)
  const shortLabel = (day) => f.date(parseDay(day.date), { day: 'numeric', month: 'short' })
  const longLabel = (day) => f.date(parseDay(day.date), { weekday: 'short', day: 'numeric', month: 'short' })
  const first = days[0]
  const last = days[count - 1]
  const middle = days[Math.floor((count - 1) / 2)]
  const summary = peak
    ? t.chartAria(f.number(total), shortLabel(first), shortLabel(last), f.number(peak.count), longLabel(peak))
    : t.chartAriaNone(shortLabel(first), shortLabel(last))

  const activeDay = active === null ? null : days[active]
  const ticks = [
    { value: top, pct: 0 },
    { value: top / 2, pct: 50 },
    { value: 0, pct: 100 },
  ]

  return (
    <Card
      title={t.chartTitle}
      aria-busy={busy || undefined}
      className={cx('transition-opacity', busy && 'opacity-60')}
      actions={
        <Button variant="ghost" size="sm" icon={tableView ? BarChart3 : Table2} onClick={() => setTableView((value) => !value)}>
          {tableView ? t.viewChart : t.viewTable}
        </Button>
      }
    >
      <dl className="mb-5 flex flex-wrap gap-x-10 gap-y-3">
        <div>
          <dt className="text-xs font-semibold text-muted">{t.chartTotal}</dt>
          <dd className="mt-0.5 text-2xl font-bold text-ink">{f.number(total)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted">{t.chartBusiest}</dt>
          <dd className="mt-0.5 text-2xl font-bold text-ink">
            {peak ? (
              <>
                {shortLabel(peak)} <span className="text-base font-semibold text-muted">· {f.number(peak.count)}</span>
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>

      {tableView ? (
        <div className="max-h-72 overflow-y-auto rounded-xl border border-white/[.08]">
          <table className="w-full text-sm">
            <caption className="sr-only">{t.chartTitle}</caption>
            <thead className="sticky top-0 bg-raised text-xs font-bold text-muted">
              <tr>
                <th scope="col" className="px-4 py-2 text-start">
                  {t.tableDate}
                </th>
                <th scope="col" className="px-4 py-2 text-end">
                  {t.tableCount}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[.06]">
              {days.map((day) => (
                <tr key={day.date}>
                  <td className="px-4 py-2">{longLabel(day)}</td>
                  <td className="px-4 py-2 text-end tabular-nums">{f.number(day.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <div aria-hidden="true" className="relative h-44 w-8 shrink-0 text-[11px] tabular-nums text-faint">
              {ticks.map(({ value, pct }) => (
                <span key={pct} className="absolute end-0 -translate-y-1/2" style={{ top: `${pct}%` }}>
                  {f.number(value)}
                </span>
              ))}
            </div>

            <div className="relative h-44 min-w-0 flex-1">
              <svg
                role="img"
                aria-label={summary}
                viewBox={`0 0 ${count * SLOT} ${HEIGHT}`}
                preserveAspectRatio="none"
                focusable="false"
                className="h-full w-full overflow-visible"
              >
                {ticks.map(({ pct }) => (
                  <line key={pct} x1="0" x2={count * SLOT} y1={pct} y2={pct} vectorEffect="non-scaling-stroke" strokeWidth="1" className="stroke-white/10" />
                ))}
                {days.map((day, index) => {
                  const x = slotOf(index) * SLOT
                  const barTop = HEIGHT - (day.count / top) * HEIGHT
                  const isActive = active === index
                  return (
                    <g key={day.date}>
                      {isActive ? <rect x={x} y="0" width={SLOT} height={HEIGHT} className="fill-white/[.06]" /> : null}
                      {day.count > 0 ? (
                        <path d={barPath({ x: x + (SLOT - BAR) / 2, width: BAR, top: barTop, base: HEIGHT, radius: RADIUS })} className={isActive ? 'fill-gold' : 'fill-accent-light'} />
                      ) : null}
                      {/* the hit area is the whole day column, not just the (possibly invisible) bar */}
                      <rect
                        data-testid={`day-${day.date}`}
                        x={x}
                        y="0"
                        width={SLOT}
                        height={HEIGHT}
                        fill="transparent"
                        onMouseEnter={() => setActive(index)}
                        onMouseLeave={() => setActive((current) => (current === index ? null : current))}
                      />
                    </g>
                  )
                })}
              </svg>

              {total === 0 ? <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted">{t.chartNone}</p> : null}

              {activeDay ? (
                // a zero-width anchor at the day's column keeps the tooltip centred without any left/right maths in RTL
                <div
                  className="pointer-events-none absolute z-10 flex w-0 -translate-y-full justify-center"
                  style={{ insetInlineStart: `${clamp(((active + 0.5) / count) * 100, 8, 92)}%`, top: `calc(${100 - (activeDay.count / top) * 100}% - 8px)` }}
                >
                  <div role="tooltip" className="w-max rounded-lg border border-white/[.12] bg-raised px-3 py-2 text-center shadow-pop">
                    <p className="text-sm font-bold text-ink">{t.requestsCount(activeDay.count)}</p>
                    <p className="text-[11px] text-muted">{longLabel(activeDay)}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* ps-10 = the y-axis column (w-8) + its gap (gap-2), so the dates line up with the plot */}
          <div aria-hidden="true" className="mt-2 flex justify-between ps-10 text-[11px] text-faint">
            <span>{shortLabel(first)}</span>
            <span>{shortLabel(middle)}</span>
            <span>{shortLabel(last)}</span>
          </div>
        </div>
      )}
    </Card>
  )
}
