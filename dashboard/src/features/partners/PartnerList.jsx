import { useState } from 'react'
import { ExternalLink, ListOrdered, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCommon, useFormat, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { useListParams } from '@/lib/useListParams'
import { Alert, Button, Card, DataTable, PageHeader, Pagination, SearchInput, Select, SortableList, StatusBadge, Switch, useConfirm } from '@/ui'
import { LogoThumb } from './LogoThumb'
import { partners } from './hooks'
import strings from './strings'
import { displayUrl, isHttpUrl } from './website'

const DEFAULTS = { per_page: 15, sort: 'order', dir: 'asc' }
// The API sets `order` = position of every id it receives, so reordering needs the WHOLE list in one page.
const REORDER_LIMIT = 200
const REORDER_PARAMS = { per_page: REORDER_LIMIT, sort: 'order', dir: 'asc' }

export default function PartnerList() {
  const t = useStrings(strings)
  const c = useCommon()
  const f = useFormat()
  const confirm = useConfirm()

  const [reordering, setReordering] = useState(false)
  const list = useListParams(DEFAULTS)
  const query = partners.useList(reordering ? REORDER_PARAMS : list.params)
  const { rows, meta } = query
  const update = partners.useUpdate()
  const remove = partners.useDelete()
  const reorder = partners.useReorder()

  const canReorder = !meta || meta.total <= REORDER_LIMIT

  // while the toggle request is running show the value the user asked for
  const activeOf = (row) => (update.isPending && update.variables?.id === row.id ? update.variables.data.is_active : row.is_active)

  // Position on the website — only meaningful while the list is sorted by `order`.
  const position = (index) => {
    if (list.sort.key !== 'order' || !meta) return null
    const from = meta.from ?? 1
    return f.number(list.sort.dir === 'desc' ? meta.total - from + 1 - index : from + index)
  }

  const onDelete = async (row) => {
    const ok = await confirm({ title: t.deleteTitle, message: t.deleteMessage(row.name), confirmLabel: c.delete })
    if (ok) remove.mutate(row.id)
  }

  const website = (row) => {
    if (!row.url) return null
    // the API only accepts http(s) today, but older rows may hold anything: show those as plain text, never as a link
    if (!isHttpUrl(row.url)) return <span dir="ltr" className="text-muted">{row.url}</span>
    return (
      <a href={row.url.trim()} target="_blank" rel="noopener noreferrer" dir="ltr" className="inline-flex max-w-[16rem] items-center gap-1.5 rounded text-accent-lighter hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light">
        <span className="truncate">{displayUrl(row.url)}</span>
        <ExternalLink size={13} aria-hidden="true" className="shrink-0" />
        <span className="sr-only">{` ${t.opensInNewTab}`}</span>
      </a>
    )
  }

  const columns = [
    { key: 'order', header: c.order, sortable: true, width: 88, cell: (row, index) => position(index) },
    {
      key: 'name',
      header: t.partner,
      sortable: true,
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <LogoThumb key={row.logo_url ?? 'none'} src={row.logo_url} />
          <p className="min-w-0 max-w-[16rem] truncate font-semibold" dir="auto">
            {row.name}
          </p>
        </div>
      ),
    },
    // the API cannot sort by website, so this column is not sortable
    { key: 'url', header: t.website, hideBelow: 'md', cell: website },
    {
      key: 'is_active',
      header: c.status,
      sortable: true,
      cell: (row) => <Switch checked={Boolean(activeOf(row))} onChange={(is_active) => update.mutate({ id: row.id, data: { is_active } })} aria-label={`${c.active}: ${row.name}`} />,
    },
  ]

  const rowActions = (row) => [
    { key: 'edit', label: c.edit, icon: Pencil, to: `/partners/${row.id}` },
    { key: 'delete', label: c.delete, icon: Trash2, tone: 'danger', onClick: () => onDelete(row), disabled: remove.isPending },
  ]

  const newButton = (
    <Button to="/partners/new" icon={Plus}>
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
          {meta?.total > REORDER_LIMIT ? <Alert tone="warning" className="mb-4">{c.reorderTooMany(REORDER_LIMIT)}</Alert> : null}
          <SortableList
            items={rows}
            ariaLabel={t.title}
            onReorder={(next) => reorder.mutate(next.map((row) => row.id))}
            renderItem={(row, { handle, isDragging, index }) => (
              <div className={`flex items-center gap-3 rounded-xl border bg-white/[.03] px-3 py-2 ${isDragging ? 'border-accent-light' : 'border-white/[.08]'}`}>
                {handle}
                <span className="w-7 text-center text-sm font-bold tabular-nums text-muted">{f.number(index + 1)}</span>
                <LogoThumb key={row.logo_url ?? 'none'} src={row.logo_url} />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold" dir="auto">
                  {row.name}
                </p>
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
