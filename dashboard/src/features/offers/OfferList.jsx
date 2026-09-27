import { useState } from 'react'
import { Gift, ListOrdered, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCommon, useFormat, useLanguage, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { useListParams } from '@/lib/useListParams'
import { Alert, Button, Card, DataTable, PageHeader, Pagination, SearchInput, Select, SortableList, StatusBadge, Switch, useConfirm } from '@/ui'
import { offers } from './hooks'
import strings from './strings'

const DEFAULTS = { per_page: 15, sort: 'order', dir: 'asc' }
// The API sets `order` = position of every id it receives, so reordering needs the WHOLE list in one page.
const REORDER_LIMIT = 200
const REORDER_PARAMS = { per_page: REORDER_LIMIT, sort: 'order', dir: 'asc' }

function Thumb({ url }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[.05]">
      {url ? <img src={url} alt="" className="size-full object-cover" /> : <Gift size={18} className="text-muted" aria-hidden="true" />}
    </span>
  )
}

export default function OfferList() {
  const t = useStrings(strings)
  const c = useCommon()
  const f = useFormat()
  const { lang, pickField } = useLanguage()
  const confirm = useConfirm()

  const [reordering, setReordering] = useState(false)
  const list = useListParams(DEFAULTS)
  const query = offers.useList(reordering ? REORDER_PARAMS : list.params)
  const { rows, meta } = query
  const update = offers.useUpdate()
  const remove = offers.useDelete()
  const reorder = offers.useReorder()

  const canReorder = !meta || meta.total <= REORDER_LIMIT
  const activeOf = (row) => (update.isPending && update.variables?.id === row.id ? update.variables.data.is_active : row.is_active)

  const onDelete = async (row) => {
    const ok = await confirm({ title: t.deleteTitle, message: t.deleteMessage(pickField(row, 'title')), confirmLabel: c.delete })
    if (ok) remove.mutate(row.id)
  }

  const columns = [
    {
      key: 'title',
      sortKey: `title_${lang}`,
      header: t.offer,
      sortable: true,
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <Thumb url={row.cover_image_url} />
          <div className="min-w-0 max-w-xl">
            <p className="truncate font-semibold">{pickField(row, 'title')}</p>
            <p className="truncate text-xs text-muted">{pickField(row, 'short')}</p>
          </div>
        </div>
      ),
    },
    { key: 'plans', header: t.plansCount, hideBelow: 'sm', cell: (row) => <span className="tabular-nums">{f.number((row.plans ?? []).length)}</span> },
    { key: 'created_at', header: c.createdAt, sortable: true, hideBelow: 'md', cell: (row) => f.date(row.created_at) },
    {
      key: 'is_active',
      header: c.status,
      sortable: true,
      cell: (row) => <Switch checked={Boolean(activeOf(row))} onChange={(is_active) => update.mutate({ id: row.id, data: { is_active } })} aria-label={`${c.active}: ${pickField(row, 'title')}`} />,
    },
  ]

  const rowActions = (row) => [
    { key: 'edit', label: c.edit, icon: Pencil, to: `/offers/${row.id}` },
    { key: 'delete', label: c.delete, icon: Trash2, tone: 'danger', onClick: () => onDelete(row), disabled: remove.isPending },
  ]

  const newButton = (
    <Button to="/offers/new" icon={Plus}>
      {t.new}
    </Button>
  )

  return (
    <>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          reordering ? (
            <Button onClick={() => setReordering(false)}>{c.reorderDone}</Button>
          ) : (
            <>
              <Button variant="secondary" icon={ListOrdered} onClick={() => setReordering(true)} disabled={!canReorder || rows.length < 2} title={canReorder ? undefined : c.reorderTooMany(REORDER_LIMIT)}>
                {c.reorder}
              </Button>
              {newButton}
            </>
          )
        }
      />

      {query.isError && rows.length === 0 ? (
        <Alert tone="danger" title={c.loadFailed} action={<Button size="sm" variant="secondary" onClick={() => query.refetch()}>{c.retry}</Button>}>
          {errorText(query.error, c)}
        </Alert>
      ) : reordering ? (
        <Card>
          <p className="mb-4 text-sm text-muted">{t.reorderIntro}</p>
          <SortableList
            items={rows}
            ariaLabel={t.title}
            onReorder={(next) => reorder.mutate(next.map((row) => row.id))}
            renderItem={(row, { handle, isDragging, index }) => (
              <div className={`flex items-center gap-3 rounded-xl border bg-white/[.03] px-3 py-2 ${isDragging ? 'border-accent-light' : 'border-white/[.08]'}`}>
                {handle}
                <span className="w-7 text-center text-sm font-bold tabular-nums text-muted">{f.number(index + 1)}</span>
                <Thumb url={row.cover_image_url} />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{pickField(row, 'title')}</p>
                <StatusBadge active={row.is_active} />
              </div>
            )}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={list.params.search ?? ''} onChange={(search) => list.set({ search })} placeholder={t.searchPlaceholder} />
            <Select
              aria-label={c.status}
              value={list.params.is_active ?? ''}
              onChange={(event) => list.set({ is_active: event.target.value })}
              options={[
                { value: '', label: `${c.status}: ${c.all}` },
                { value: '1', label: c.active },
                { value: '0', label: c.inactive },
              ]}
              wrapperClassName="w-full sm:w-52"
            />
            {list.hasFilters ? (
              <Button variant="ghost" size="sm" onClick={list.reset}>
                {c.reset}
              </Button>
            ) : null}
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            loading={query.isLoading}
            busy={query.isFetching && !query.isLoading}
            sort={list.sort}
            onSortChange={list.setSort}
            rowActions={rowActions}
            caption={t.title}
            emptyTitle={list.hasFilters ? c.noResults : t.emptyTitle}
            emptyDescription={list.hasFilters ? c.noResultsHint : t.emptyHint}
            emptyAction={list.hasFilters ? null : newButton}
          />

          <Pagination meta={meta} onPageChange={list.setPage} onPerPageChange={list.setPerPage} />
        </div>
      )}
    </>
  )
}
