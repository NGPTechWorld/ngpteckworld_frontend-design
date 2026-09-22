import { useEffect, useRef } from 'react'
import { cx } from '@/lib/cx'
import { focusRing } from './styles'

/** Native checkbox, brand-tinted. `onChange(nextBoolean)`. `indeterminate` for "some selected". */
export function Checkbox({ checked = false, indeterminate = false, onChange, label, className, inputClassName, ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate) && !checked
  }, [indeterminate, checked])

  const input = (
    <input
      ref={ref}
      type="checkbox"
      checked={Boolean(checked)}
      onChange={(event) => onChange?.(event.target.checked)}
      className={cx('size-4 shrink-0 cursor-pointer rounded accent-[#9678BE]', focusRing, inputClassName)}
      {...rest}
    />
  )
  if (!label) return input
  return (
    <label className={cx('inline-flex cursor-pointer items-center gap-2 text-sm text-ink', className)}>
      {input}
      {label}
    </label>
  )
}
