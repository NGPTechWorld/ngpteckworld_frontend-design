import { Save } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { cx } from '@/lib/cx'
import { Button } from '@/ui'
import strings from './strings'

/**
 * Sticky bar under the whole page: "n unsaved changes", Discard and Save. It is the submit button of the page's form, so it
 * saves the edits of every tab at once. Save stays disabled until something changed. The negative margins cancel the padding of
 * the layout's `<main>` so the bar spans its full width.
 */
export function SaveBar({ dirtyCount, saving, onDiscard }) {
  const c = useCommon()
  const t = useStrings(strings)
  const dirty = dirtyCount > 0

  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-wrap items-center gap-3 border-t border-white/[.08] bg-deep/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <p role="status" className={cx('me-auto flex items-center gap-2 text-sm', dirty ? 'font-semibold text-gold' : 'text-muted')}>
        {dirty ? <span aria-hidden="true" className="size-2 rounded-full bg-gold" /> : null}
        {dirty ? t.unsaved(dirtyCount) : t.noUnsaved}
      </p>
      <Button variant="secondary" onClick={onDiscard} disabled={!dirty || saving}>
        {t.discardAll}
      </Button>
      <Button type="submit" icon={Save} loading={saving} disabled={!dirty}>
        {saving ? c.saving : t.saveChanges}
      </Button>
    </div>
  )
}
