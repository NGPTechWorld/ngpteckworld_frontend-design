import { ChevronDown } from 'lucide-react'
import { cx } from '@/lib/cx'
import { useFieldContext } from './Field'
import { controlClass } from './styles'

/**
 * Native <select> with the brand look. Pass `options={[{ value, label, disabled? }]}` (or <option> children).
 * `placeholder` adds a first empty option (value ''). onChange is the native event (`e.target.value` is a string).
 */
export function Select({ options, placeholder, invalid, className, wrapperClassName, id, children, ...rest }) {
  const field = useFieldContext()
  const isInvalid = invalid ?? field?.invalid
  return (
    <div className={cx('relative', wrapperClassName)}>
      <select
        id={id ?? field?.id}
        aria-invalid={isInvalid || undefined}
        aria-describedby={field?.describedBy}
        className={controlClass(isInvalid, cx('appearance-none pe-10 [&>option]:bg-surface [&>option]:text-ink', className))}
        {...rest}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options
          ? options.map((option) => (
              <option key={String(option.value)} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  )
}
