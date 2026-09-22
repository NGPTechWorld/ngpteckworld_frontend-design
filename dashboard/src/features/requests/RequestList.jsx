import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download, Eye, Inbox, Trash2 } from 'lucide-react'
import { useDashboard } from '@/features/dashboard/hooks'
import { useCommon, useFormat, useLanguage, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { useListParams } from '@/lib/useListParams'
import { cx } from '@/lib/cx'
import { Alert, Button, DataTable, Field, Input, PageHeader, Pagination, SearchInput, Select, TabPanel, Tabs, useConfirm, useToast } from '@/ui'
import { STATUSES, statusOptions } from './constants'
import { requests, useBulkRequests, useDeleteRequest, useExportRequests, useUpdateRequest } from './hooks'
import strings from './strings'

const DEFAULTS = { per_page: 15, sort: 'created_at', dir: 'desc' }
const stop = (event) => event.stopPropagation()

export default function RequestList() {
  const t = useStrings(strings)
  const c = useCommon()
  const f = useFormat()
  const confirm = useConfirm()
  const toast = useToast()
  const navigate = useNavigate()
  const { dir } = useLanguage()

  const list = useListParams(DEFAULTS)
  // an unknown ?status= in the URL behaves like "All" (the tab bar and the request agree)
  const status = STATUSES.includes(list.params.status) ? list.params.status : ''
  const params = useMemo(() => ({ ...list.params, status }), [list.params, status])
  const paramsKey = JSON.stringify(params)

  const query = requests.useList(params)
  const { rows, meta } = query
  const counts = useDashboard().data?.counts // tab badges; the inbox works without them if this fails
  const update = useUpdateRequest()
  const remove = useDeleteRequest()
  const bulk = useBulkRequests()
  const exporter = useExportRequests()

  const [selected, setSelected] = useState([])
  // a selection belongs to the page it was made on
  useEffect(() => setSelected([]), [paramsKey])

  const options = useMemo(() => statusOptions(c), [c])
  const tab = status || 'all'
  const tabs = [
    { key: 'all', label: c.all, badge: counts ? f.number(counts.requests_total) : undefined },
    ...STATUSES.map((value) => ({ key: value, label: c.statusLabels[value], badge: counts ? f.number(counts[`requests_${value}`]) : undefined })),
  ]

  // while the request runs show the value the user asked for
  const statusOf = (row) => (update.isPending && update.variables?.id === row.id ? update.variables.data.status : row.status)

  const onDelete = async (row) => {
    const ok = await confirm({ title: t.deleteTitle, message: t.deleteMessage(row.name), confirmLabel: c.delete })
    if (ok) remove.mutate(row.id)
  }

  const applyBulkStatus = (next) => bulk.mutate({ action: 'status', ids: selected, status: next }, { onSuccess: () => setSelected([]) })
  const deleteSelected = async () => {
    const ok = await confirm({ title: t.bulkDeleteTitle, message: t.bulkDeleteMessage(selected.length), confirmLabel: c.delete })
    if (ok) bulk.mutate({ action: 'delete', ids: selected }, { onSuccess: () => setSelected([]) })
  }

  // the CSV holds everything the list would show (same filters, search and sort), not just the current page
  const onExport = () => {
    const filters = Object.fromEntries(Object.entries(params).filter(([key]) => key !== 'page' && key !== 'per_page'))
    exporter.mutate(filters, {
      onSuccess: () => toast.success(t.exportDone),
      onError: (err) => toast.error(errorText(err, c)),
    })
  }

  // Name + a one-line preview of the message share a column (a separate message column would not fit next to the
  // sidebar); the email column needs a wide screen. User text: dir="auto" orders it by its own script and
  // inline-block keeps it aligned to the page direction.
  const columns = [
    {
      key: 'name',
      header: t.name,
      sortable: true,
      cell: (row) => (
        <div className="flex min-w-0 max-w-[13rem] items-start gap-2.5 xl:max-w-[16rem]">
          <span aria-hidden="true" className={cx('mt-1.5 size-2 shrink-0 rounded-full', row.status === 'new' && 'bg-gold')} />
          <div className="min-w-0">
            <Link
              to={`/requests/${row.id}`}
              onClick={stop}
              dir="auto"
              className="inline-block max-w-full truncate rounded align-bottom font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light"
            >
              {row.name}
            </Link>
            <p className="text-xs text-muted">
              <span dir="auto" className="inline-block max-w-full truncate align-bottom">
                {row.message}
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: t.email,
      sortable: true,
      hideBelow: 'xl',
      cell: (row) => (
        <span dir="ltr" className="inline-block max-w-[11rem] truncate align-bottom text-muted">
          {row.email}
        </span>
      ),
    },
    {
      key: 'status',
      header: c.status,
      sortable: true,
      cell: (row) => (
        // the row itself is clickable (opens the request): keep the select from triggering that
        <div onClick={stop}>
          <Select
            aria-label={t.statusOf(row.name)}
            value={statusOf(row)}
            onChange={(event) => update.mutate({ id: row.id, data: { status: event.target.value } })}
            options={options}
            wrapperClassName="w-36"
            className="!h-9 !py-1 text-[13px]"
          />
        </div>
      ),
    },
    {
      key: 'created_at',
      header: t.receivedAt,
      sortable: true,
      hideBelow: 'sm',
      cell: (row) => (
        <time dateTime={row.created_at} title={f.dateTime(row.created_at)} className="whitespace-nowrap text-muted">
          {f.relative(row.created_at)}
        </time>
      ),
    },
  ]

  const rowActions = (row) => [
    { key: 'view', label: t.view, icon: Eye, to: `/requests/${row.id}` },
    { key: 'delete', label: c.delete, icon: Trash2, tone: 'danger', onClick: () => onDelete(row), disabled: remove.isPending },
  ]

  return (
    <>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button variant="secondary" icon={Download} loading={exporter.isPending} disabled={meta?.total === 0} onClick={onExport}>
            {exporter.isPending ? t.exporting : t.export}
          </Button>
        }
      />

      <Tabs idPrefix="requests" label={t.statusTabs} tabs={tabs} value={tab} onChange={(key) => list.set({ status: key === 'all' ? '' : key })} />

      <TabPanel idPrefix="requests" value={tab} active={tab} className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <SearchInput dir={dir} value={list.params.search ?? ''} onChange={(search) => list.set({ search })} placeholder={t.searchPlaceholder} />
          <Field label={t.from} className="w-full sm:w-44">
            <Input type="date" value={list.params.from ?? ''} max={list.params.to || undefined} onChange={(event) => list.set({ from: event.target.value })} />
          </Field>
          <Field label={t.to} className="w-full sm:w-44">
            <Input type="date" value={list.params.to ?? ''} min={list.params.from || undefined} onChange={(event) => list.set({ to: event.target.value })} />
          </Field>
          {list.hasFilters ? (
            <Button variant="ghost" size="sm" className="mb-0.5" onClick={list.reset}>
              {c.reset}
            </Button>
          ) : null}
        </div>

        {selected.length > 0 ? (
          <div role="region" aria-label={t.bulkActions} className="flex flex-wrap items-center gap-2 rounded-xl border border-accent-light/30 bg-accent/15 px-4 py-2.5">
            <span className="text-sm font-semibold text-ink">{c.selectedCount(f.number(selected.length))}</span>
            <div className="ms-auto flex flex-wrap items-center gap-2">
              {STATUSES.map((value) => (
                <Button key={value} variant="secondary" size="sm" disabled={bulk.isPending} onClick={() => applyBulkStatus(value)}>
                  {t.markAs[value]}
                </Button>
              ))}
              <Button variant="danger" size="sm" icon={Trash2} disabled={bulk.isPending} onClick={deleteSelected}>
                {c.delete}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                {t.clearSelection}
              </Button>
            </div>
          </div>
        ) : null}

        {query.isError && rows.length === 0 ? (
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
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              loading={query.isLoading}
              busy={query.isFetching && !query.isLoading}
              sort={list.sort}
              onSortChange={list.setSort}
              selectable
              selected={selected}
              onSelectedChange={setSelected}
              rowActions={rowActions}
              onRowClick={(row) => navigate(`/requests/${row.id}`)}
              caption={t.title}
              minWidth={640}
              emptyIcon={Inbox}
              emptyTitle={list.hasFilters ? c.noResults : t.emptyTitle}
              emptyDescription={list.hasFilters ? c.noResultsHint : t.emptyHint}
            />
            <Pagination meta={meta} onPageChange={list.setPage} onPerPageChange={list.setPerPage} />
          </>
        )}
      </TabPanel>
    </>
  )
}
