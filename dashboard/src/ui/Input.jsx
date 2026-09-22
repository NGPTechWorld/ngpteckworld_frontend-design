import { cx } from '@/lib/cx'
import { useFieldContext } from './Field'
import { controlClass } from './styles'

// Content that is always left-to-right even in the Arabic UI (passwords are typed in either script, so they
// follow the ambient page direction instead — see PasswordInput).
const LTR_TYPES = new Set(['email', 'url', 'tel', 'number'])

/**
 * Text input, spreads onto <input> — works with `{...register('name')}` (React 19: `ref` is a normal prop).
 * `invalid` is picked up from <Field error>. email/url/tel/number are rendered dir="ltr".
 * `startIcon` / `endAdornment` place content inside the box using logical sides.
 */
export function Input({ type = 'text', invalid, dir, startIcon: StartIcon, endAdornment, className, id, ...rest }) {
  const field = useFieldContext()
  const isInvalid = invalid ?? field?.invalid
  const input = (
    <input
      id={id ?? field?.id}
      type={type}
      dir={dir ?? (LTR_TYPES.has(type) ? 'ltr' : undefined)}
      aria-invalid={isInvalid || undefined}
      aria-describedby={field?.describedBy}
      className={controlClass(isInvalid, cx(StartIcon && 'ps-10', endAdornment && 'pe-11', className))}
      {...rest}
    />
  )
  if (!StartIcon && !endAdornment) return input

  return (
    <div className="relative">
      {StartIcon ? <StartIcon size={16} aria-hidden="true" className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-faint" /> : null}
      {input}
      {endAdornment ? <div className="absolute end-1.5 top-1/2 -translate-y-1/2">{endAdornment}</div> : null}
    </div>
  )
}
