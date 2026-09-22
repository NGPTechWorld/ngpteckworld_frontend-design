import { useId } from 'react'
import { cx } from '@/lib/cx'
import { useFieldContext } from './Field'
import { focusRing } from './styles'

/**
 * Toggle. Controlled: `checked` + `onChange(nextBoolean)`.
 *   <Switch checked={value} onChange={setValue} label="Active" />
 * Without a visible `label` pass `aria-label`. With react-hook-form use <Controller> (see docs/UI-KIT.md).
 */
export function Switch({ checked = false, onChange, label, description, disabled = false, id, className, ...rest }) {
  const field = useFieldContext()
  const autoId = useId()
  const switchId = id ?? field?.id ?? autoId

  return (
    <div className={cx('flex items-center gap-3', className)}>
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={Boolean(checked)}
        aria-describedby={field?.describedBy}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cx(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          focusRing,
          checked ? 'border-accent-light bg-accent' : 'border-white/[.16] bg-white/[.08]',
        )}
        {...rest}
      >
        <span
          aria-hidden="true"
          className={cx(
            'absolute top-[3px] size-[18px] rounded-full bg-white shadow transition-all',
            checked ? 'start-[calc(100%-21px)]' : 'start-[3px]',
          )}
        />
      </button>
      {label || description ? (
        <label htmlFor={switchId} className="cursor-pointer select-none">
          {label ? <span className="block text-sm font-medium text-ink">{label}</span> : null}
          {description ? <span className="block text-xs text-muted">{description}</span> : null}
        </label>
      ) : null}
    </div>
  )
}
