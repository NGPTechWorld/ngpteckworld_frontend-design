import { useId, useImperativeHandle, useRef } from 'react'
import { Star } from 'lucide-react'
import { useFormat, useLanguage, useStrings } from '@/i18n'
import { cx } from '@/lib/cx'
import { focusRing } from '@/ui'
import strings from './strings'

export const MAX_RATING = 5
const STARS = Array.from({ length: MAX_RATING }, (_, index) => index + 1)

/** Read-only rating for list rows: five stars, `value` of them filled. */
export function Stars({ value, size = 14 }) {
  const t = useStrings(strings)
  return (
    <span role="img" aria-label={t.ratingOf(value)} className="inline-flex items-center gap-0.5">
      {STARS.map((n) => (
        <Star key={n} size={size} aria-hidden="true" className={n <= value ? 'fill-gold text-gold' : 'text-faint'} />
      ))}
    </span>
  )
}

/**
 * Rating chooser: a radio group of five stars. Roving tabindex (one tab stop: the chosen star, or the first),
 * arrow keys choose and move focus — Left/Right follow the visual direction (mirrored in the Arabic UI, where the
 * first star is on the right), Up/Down go to the next/previous star, Home/End jump to 1 / 5. It stops at the ends.
 *
 * Controlled: `value` (1–5) + `onChange(n)`. Works as a react-hook-form <Controller> field: pass `field.ref` as
 * `ref` so a validation error can focus the group.
 */
export function StarRatingInput({ value, onChange, label, required = false, error, hint, ref }) {
  const t = useStrings(strings)
  const f = useFormat()
  const { dir } = useLanguage()
  const id = useId()
  const groupRef = useRef(null)
  const stars = useRef([])
  const rtl = dir === 'rtl'
  const message = typeof error === 'string' ? error : error?.message
  const current = STARS.includes(value) ? value : 0
  const tabbable = current || 1

  useImperativeHandle(ref, () => ({ focus: () => groupRef.current?.querySelector('[tabindex="0"]')?.focus() }), [])

  const choose = (n) => {
    const next = Math.min(MAX_RATING, Math.max(1, n))
    onChange?.(next)
    stars.current[next - 1]?.focus()
  }

  const onKeyDown = (event, n) => {
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }[event.key]
    if (step !== undefined) choose(n + step)
    else if (event.key === 'Home') choose(1)
    else if (event.key === 'End') choose(MAX_RATING)
    else return
    event.preventDefault()
  }

  return (
    <div>
      <span id={`${id}-label`} className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-soft">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-gold">
            *
          </span>
        ) : null}
      </span>
      <div className="flex items-center gap-3">
        <div
          ref={groupRef}
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="inline-flex items-center gap-0.5"
        >
          {STARS.map((n) => (
            <button
              key={n}
              ref={(node) => {
                stars.current[n - 1] = node
              }}
              type="button"
              role="radio"
              aria-checked={n === current}
              aria-label={t.ratingOption(n)}
              tabIndex={n === tabbable ? 0 : -1}
              onClick={() => onChange?.(n)}
              onKeyDown={(event) => onKeyDown(event, n)}
              className={cx('inline-flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-white/[.07]', focusRing, message && !current && 'ring-1 ring-danger/50')}
            >
              <Star size={24} aria-hidden="true" className={n <= current ? 'fill-gold text-gold' : 'text-faint'} />
            </button>
          ))}
        </div>
        {current ? (
          <bdi dir="ltr" aria-hidden="true" className="text-sm font-semibold tabular-nums text-muted">
            {f.number(current)} / {f.number(MAX_RATING)}
          </bdi>
        ) : null}
      </div>
      {message ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger">
          {message}
        </p>
      ) : null}
      {hint && !message ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
