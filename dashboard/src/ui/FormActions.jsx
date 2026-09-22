import { Save } from 'lucide-react'
import { useCommon } from '@/i18n'
import { cx } from '@/lib/cx'
import { Button } from './Button'

/**
 * Save / Cancel row for forms (place it INSIDE the <form>; Save is the submit button).
 *   <FormActions saving={isPending} dirty={isDirty} cancelTo="/faqs" />
 * Save is disabled while `saving`; when `dirty` is passed (edit forms: `formState.isDirty`) it is also disabled
 * while the form is pristine. Leave `dirty` out on create forms. `sticky` pins the bar to the bottom of the viewport.
 * `onCancel` instead of `cancelTo` for custom cancel handling; `children` are extra buttons before Save.
 */
export function FormActions({ saving = false, dirty, disabled = false, saveLabel, cancelLabel, cancelTo, onCancel, sticky = false, className, children }) {
  const c = useCommon()
  const pristine = dirty === false
  return (
    <div
      className={cx(
        'flex flex-wrap items-center justify-end gap-2',
        sticky && 'sticky bottom-0 z-10 -mx-4 border-t border-white/[.08] bg-deep/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6',
        className,
      )}
    >
      {children}
      {cancelTo || onCancel ? (
        <Button variant="secondary" to={cancelTo} onClick={onCancel} disabled={saving}>
          {cancelLabel ?? c.cancel}
        </Button>
      ) : null}
      <Button type="submit" icon={Save} loading={saving} disabled={disabled || pristine}>
        {saving ? c.saving : (saveLabel ?? c.save)}
      </Button>
    </div>
  )
}
