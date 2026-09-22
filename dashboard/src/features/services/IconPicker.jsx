import { useId, useImperativeHandle, useRef } from 'react'
import { Check } from 'lucide-react'
import { useLanguage } from '@/i18n'
import { cx } from '@/lib/cx'
import { focusRing } from '@/ui'
import { ServiceIcon, SERVICE_ICON_KEYS } from './icons'

/**
 * Icon chooser for a service: a radio group of tiles, each one showing the icon and its name.
 * A native <select> cannot draw icons inside its options, and native radios move "the wrong way" with the
 * arrow keys in right-to-left pages, so the keyboard handling is done here: Left/Right follow the visual
 * direction (mirrored in Arabic), Up/Down go to the next/previous tile, Home/End jump to the ends.
 *
 * Controlled: `value` (icon key or '') + `onChange(key)`; `labels` = { web: 'Web', … }. Works as a react-hook-form
 * <Controller> field: pass `field.ref` as `ref` so a validation error can focus the group.
 */
export function IconPicker({ value, onChange, labels, label, required = false, error, hint, ref }) {
  const { dir } = useLanguage()
  const id = useId()
  const groupRef = useRef(null)
  const tiles = useRef([])
  const rtl = dir === 'rtl'
  const message = typeof error === 'string' ? error : error?.message
  const selected = SERVICE_ICON_KEYS.indexOf(value)
  const tabbable = selected >= 0 ? selected : 0 // roving tabindex: one tab stop for the whole group

  useImperativeHandle(ref, () => ({ focus: () => groupRef.current?.querySelector('[tabindex="0"]')?.focus() }), [])

  const choose = (index) => {
    const next = (index + SERVICE_ICON_KEYS.length) % SERVICE_ICON_KEYS.length
    onChange?.(SERVICE_ICON_KEYS[next])
    tiles.current[next]?.focus()
  }

  const onKeyDown = (event, index) => {
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }[event.key]
    if (step !== undefined) choose(index + step)
    else if (event.key === 'Home') choose(0)
    else if (event.key === 'End') choose(SERVICE_ICON_KEYS.length - 1)
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
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {SERVICE_ICON_KEYS.map((key, index) => {
          const checked = key === value
          return (
            <button
              key={key}
              ref={(node) => {
                tiles.current[index] = node
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={index === tabbable ? 0 : -1}
              onClick={() => onChange?.(key)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cx(
                'relative flex flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3.5 text-center text-[13px] font-medium transition-colors',
                focusRing,
                checked
                  ? 'border-accent-light bg-accent/25 text-ink'
                  : message
                    ? 'border-danger/50 bg-white/[.03] text-muted hover:text-ink'
                    : 'border-white/[.12] bg-white/[.03] text-muted hover:border-white/25 hover:text-ink',
              )}
            >
              {checked ? <Check size={14} aria-hidden="true" className="absolute end-2 top-2 text-accent-lighter" /> : null}
              <ServiceIcon name={key} size={24} className={checked ? 'text-accent-lighter' : undefined} />
              <span>{labels[key]}</span>
            </button>
          )
        })}
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
