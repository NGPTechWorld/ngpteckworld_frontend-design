import { cx } from '@/lib/cx'
import { useFieldContext } from './Field'
import { controlClass } from './styles'

/** Multi-line input; same conventions as <Input> (register-compatible, picks up <Field> wiring). */
export function Textarea({ rows = 4, invalid, className, id, ...rest }) {
  const field = useFieldContext()
  const isInvalid = invalid ?? field?.invalid
  return (
    <textarea
      id={id ?? field?.id}
      rows={rows}
      aria-invalid={isInvalid || undefined}
      aria-describedby={field?.describedBy}
      className={controlClass(isInvalid, cx('min-h-[88px] resize-y leading-relaxed', className))}
      {...rest}
    />
  )
}
