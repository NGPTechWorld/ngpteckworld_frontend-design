import { ListOrdered, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCommon, useFormat, useLanguage, useStrings } from '@/i18n'
import { cx } from '@/lib/cx'
import { errorText } from '@/lib/errors'
import { Alert, Badge, Button, Card, EmptyState, IconButton, Skeleton, SortableList, Switch, useConfirm } from '@/ui'
import { COLLECTION_PAGE_SIZE, collectionParams, contentItems } from './hooks'
import { hasBody } from './schema'
import strings from './strings'
import { ValueIcon } from './ValueIcon'

/**
 * One repeatable collection (process steps, values, why-us) as a sortable card. It loads its own items — the whole
 * collection in one request, because the reorder endpoint needs every id — and hands add / edit to the page, which owns
 * the modal (`onAdd(collection)`, `onEdit(collection, item)`). Toggling "shown" and deleting happen right here.
 */
export function CollectionManager({ collection, onAdd, onEdit }) {
  const t = useStrings(strings)
  const c = useCommon()
  const f = useFormat()
  const { lang, pickField } = useLanguage()
  const confirm = useConfirm()
  const names = t.collections[collection]
  const otherLang = lang === 'ar' ? 'en' : 'ar'

  const query = contentItems.useList(collectionParams(collection))
  const { rows, meta } = query
  const update = contentItems.useUpdate()
  const remove = contentItems.useDelete()
  const reorder = contentItems.useReorder()

  const tooMany = (meta?.total ?? 0) > COLLECTION_PAGE_SIZE
  const allInactive = rows.length > 0 && rows.every((row) => !row.is_active)

  // while the toggle request runs show the value the user asked for
  const activeOf = (row) => Boolean(update.isPending && update.variables?.id === row.id ? update.variables.data.is_active : row.is_active)

  const onDelete = async (row) => {
    const ok = await confirm({ title: names.deleteTitle, message: names.deleteMessage(pickField(row, 'title')), confirmLabel: c.delete })
    if (ok) remove.mutate(row.id)
  }

  let content
  if (query.isLoading) {
    content = (
      <div aria-busy="true" className="space-y-2">
        <span className="sr-only">{c.loading}</span>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-[58px] rounded-xl" />
        ))}
      </div>
    )
  } else if (query.isError && rows.length === 0) {
    content = (
      <Alert
        tone="danger"
        title={c.loadFailed}
        action={
          <Button size="sm" variant="secondary" onClick={() => query.refetch()}>
            {c.retry}
          </Button>
        }
      >
        {errorText(query.error, c)}
      </Alert>
    )
  } else if (rows.length === 0) {
    content = <EmptyState icon={ListOrdered} title={names.emptyTitle} description={names.emptyHint} />
  } else {
    content = (
      <div className="space-y-3">
        {allInactive ? <Alert tone="warning">{t.allInactive}</Alert> : null}
        {tooMany ? <Alert tone="warning">{c.reorderTooMany(COLLECTION_PAGE_SIZE)}</Alert> : null}
        {rows.length > 1 && !tooMany ? <p className="text-xs text-muted">{c.reorderHint}</p> : null}
        <SortableList
          items={rows}
          ariaLabel={names.title}
          disabled={tooMany}
          onReorder={(next) => reorder.mutate(next.map((row) => row.id))}
          renderItem={(row, { handle, isDragging, index }) => {
            const title = pickField(row, 'title')
            const snippet = hasBody(collection) ? pickField(row, 'body') : ''
            const active = activeOf(row)
            return (
              <div className={cx('flex flex-wrap items-center gap-3 rounded-xl border bg-white/[.03] px-3 py-2.5', isDragging ? 'border-accent-light' : 'border-white/[.08]')}>
                {handle}
                <span className="w-6 shrink-0 text-center text-sm font-bold tabular-nums text-muted">{f.number(index + 1)}</span>
                {collection === 'values' ? (
                  <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/25 text-accent-lighter">
                    <ValueIcon iconKey={row.icon_key} />
                  </span>
                ) : null}
                <div className={cx('min-w-0 flex-1 basis-44', !active && 'opacity-60')}>
                  <p className="truncate text-sm font-semibold">{title}</p>
                  <p className="truncate text-xs text-muted">
                    <bdi dir={otherLang === 'ar' ? 'rtl' : 'ltr'} lang={otherLang}>
                      {row[`title_${otherLang}`]}
                    </bdi>
                  </p>
                  {snippet ? <p className="mt-1 line-clamp-2 text-xs text-soft">{snippet}</p> : null}
                </div>
                <div className="ms-auto flex items-center gap-1.5">
                  {!active ? <Badge>{t.hiddenOnSite}</Badge> : null}
                  <Switch
                    checked={active}
                    onChange={(is_active) => update.mutate({ id: row.id, data: { is_active } })}
                    aria-label={`${c.active}: ${title}`}
                    title={c.active}
                  />
                  <IconButton icon={Pencil} label={`${c.edit}: ${title}`} onClick={() => onEdit(collection, row)} />
                  <IconButton icon={Trash2} tone="danger" label={`${c.delete}: ${title}`} onClick={() => onDelete(row)} disabled={remove.isPending} />
                </div>
              </div>
            )
          }}
        />
      </div>
    )
  }

  return (
    <Card
      title={names.title}
      description={names.description}
      actions={
        <Button variant="secondary" size="sm" icon={Plus} onClick={() => onAdd(collection)}>
          {names.add}
        </Button>
      }
    >
      {content}
    </Card>
  )
}
