import { useMemo, useState } from 'react'
import { FolderKanban, Link2, ListOrdered, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useCommon, useFormat, useLanguage, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { useListParams } from '@/lib/useListParams'
import { Alert, Avatar, Badge, Button, Card, DataTable, PageHeader, Pagination, SearchInput, Select, SortableList, StatusBadge, Switch, useConfirm } from '@/ui'
import { projects } from './hooks'
import { CATEGORIES, STATUSES } from './schema'
import strings from './strings'

const DEFAULTS = { per_page: 15, sort: 'order', dir: 'asc' }
// The API sets `order` = position of every id it receives, so reordering needs the WHOLE list in one page.
const REORDER_LIMIT = 200

export default function ProjectList() {
  const t = useStrings(strings)
  const c = useCommon()
  const f = useFormat()
  const { lang, pickField } = useLanguage()
  const confirm = useConfirm()

  const [reordering, setReordering] = useState(false)
  const list = useListParams(DEFAULTS)
  const query = projects.useList(reordering ? { per_page: REORDER_LIMIT, sort: 'order', dir: 'asc' } : list.params)
  const { rows, meta } = query
  const update = projects.useUpdate()
  const remove = projects.useDelete()
  const reorder = projects.useReorder()

  const canReorder = !meta || meta.total <= REORDER_LIMIT
  const otherLang = lang === 'ar' ? 'en' : 'ar'

  // project statuses read "Completed" / "In progress" (the shared badge says "In progress" as "Processing")
  const statusBadges = useMemo(
    () => ({
      completed: { tone: 'success', label: t.projectStatuses.completed },
      in_progress: { tone: 'warning', label: t.projectStatuses.in_progress },
    }),
    [t],
  )

  // while the toggle request is running show the value the user asked for
  const featuredOf = (row) => (update.isPending && update.variables?.id === row.id ? update.variables.data.featured : row.featured)

  const onDelete = async (row) => {
    const ok = await confirm({ title: t.deleteTitle, message: t.deleteMessage(pickField(row, 'name')), confirmLabel: c.delete })
    if (ok) remove.mutate(row.id)
  }

  const thumb = (row) => <Avatar src={row.cover_image_url} name={pickField(row, 'name')} alt="" shape="rounded" />

  const columns = [
    {
      key: 'order',
      header: c.order,
      sortable: true,
      width: 88,
      hideBelow: 'sm',
      cell: (row, index) => f.number((meta?.from ?? 1) + index), // row number in the current view
    },
    {
      key: 'name',
      header: t.colProject,
      sortable: true,
      sortKey: `name_${lang}`,
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          {thumb(row)}
          <div className="min-w-0 max-w-xs">
            <p className="truncate font-semibold">{pickField(row, 'name')}</p>
            <p className="truncate text-xs text-muted">
              <bdi dir={otherLang === 'ar' ? 'rtl' : 'ltr'} lang={otherLang}>
                {row[`name_${otherLang}`]}
              </bdi>
            </p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: t.colCategory, sortable: true, cell: (row) => <Badge tone="accent">{t.categories[row.category] ?? row.category}</Badge> },
    {
      key: 'client',
      header: t.colClient,
      sortable: true,
      hideBelow: 'lg',
      cell: (row) => (
        <span dir="auto" className="block max-w-[12rem] truncate">
          {row.client}
        </span>
      ),
    },
    { key: 'year', header: t.colYear, sortable: true, hideBelow: 'md', cell: (row) => <span className="tabular-nums">{row.year}</span> },
    { key: 'status', header: c.status, sortable: true, cell: (row) => <StatusBadge status={row.status} statuses={statusBadges} /> },
    {
      key: 'featured',
      header: t.colFeatured,
      sortable: true,
      cell: (row) => (
        <Switch
          checked={Boolean(featuredOf(row))}
          onChange={(featured) => update.mutate({ id: row.id, data: { featured } })}
          aria-label={t.featuredToggle(pickField(row, 'name'))}
        />
      ),
    },
    {
      key: 'team_members_count',
      header: t.colTeam,
      hideBelow: 'lg',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 tabular-nums text-muted" title={t.teamCount(row.team_members_count ?? 0)}>
          <Users size={14} aria-hidden="true" />
          {f.number(row.team_members_count ?? 0)}
        </span>
      ),
    },
    {
      key: 'links_count',
      header: t.colLinks,
      hideBelow: 'lg',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 tabular-nums text-muted" title={t.linksCount(row.links_count ?? 0)}>
          <Link2 size={14} aria-hidden="true" />
          {f.number(row.links_count ?? 0)}
        </span>
      ),
    },
  ]

  const rowActions = (row) => [
    { key: 'edit', label: c.edit, icon: Pencil, to: `/projects/${row.id}` },
    { key: 'delete', label: c.delete, icon: Trash2, tone: 'danger', onClick: () => onDelete(row), disabled: remove.isPending },
  ]

  const newButton = (
    <Button to="/projects/new" icon={Plus}>
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
          {meta?.total > REORDER_LIMIT ? (
            <Alert tone="warning" className="mb-4">
              {c.reorderTooMany(REORDER_LIMIT)}
            </Alert>
          ) : null}
          <SortableList
            items={rows}
            ariaLabel={t.title}
            onReorder={(next) => reorder.mutate(next.map((row) => row.id))}
            renderItem={(row, { handle, isDragging, index }) => (
              <div className={`flex items-center gap-3 rounded-xl border bg-white/[.03] px-3 py-2 ${isDragging ? 'border-accent-light' : 'border-white/[.08]'}`}>
                {handle}
                <span className="w-7 text-center text-sm font-bold tabular-nums text-muted">{f.number(index + 1)}</span>
                {thumb(row)}
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{pickField(row, 'name')}</p>
                <Badge tone="accent" className="hidden sm:inline-flex">
                  {t.categories[row.category] ?? row.category}
                </Badge>
                <StatusBadge status={row.status} statuses={statusBadges} className="hidden sm:inline-flex" />
              </div>
            )}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={list.params.search ?? ''} onChange={(search) => list.set({ search })} placeholder={t.searchPlaceholder} />
            <Select
              aria-label={t.categoryFilter}
              value={list.params.category ?? ''}
              onChange={(event) => list.set({ category: event.target.value })}
              options={[{ value: '', label: `${t.categoryFilter}: ${c.all}` }, ...CATEGORIES.map((value) => ({ value, label: t.categories[value] }))]}
              wrapperClassName="w-full sm:w-52"
            />
            <Select
              aria-label={c.status}
              value={list.params.status ?? ''}
              onChange={(event) => list.set({ status: event.target.value })}
              options={[{ value: '', label: `${c.status}: ${c.all}` }, ...STATUSES.map((value) => ({ value, label: t.projectStatuses[value] }))]}
              wrapperClassName="w-full sm:w-52"
            />
            <Select
              aria-label={t.featuredFilter}
              value={list.params.featured ?? ''}
              onChange={(event) => list.set({ featured: event.target.value })}
              options={[
                { value: '', label: `${t.featuredFilter}: ${c.all}` },
                { value: '1', label: t.featuredOnly },
                { value: '0', label: t.notFeatured },
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
            emptyIcon={FolderKanban}
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
