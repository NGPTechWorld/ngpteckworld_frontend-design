import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, ShoppingBag, Trash2 } from 'lucide-react'
import { useCommon, useFormat, useLanguage, useStrings } from '@/i18n'
import { errorText } from '@/lib/errors'
import { useListParams } from '@/lib/useListParams'
import { cx } from '@/lib/cx'
import { Alert, Button, DataTable, PageHeader, Pagination, SearchInput, Select, TabPanel, Tabs, useConfirm } from '@/ui'
import { STATUSES, statusOptions } from '@/features/requests/constants'
import { TYPES, offerRequests, useBulkOfferRequests } from './hooks'
import strings from './strings'
import { TypeBadge } from './TypeBadge'

const DEFAULTS = { per_page: 15, sort: 'created_at', dir: 'desc' }
const stop = (event) => event.stopPropagation()

export default function OfferRequestList() {
  const t = useStrings(strings)
  const c = useCommon()
  const f = useFormat()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const { dir, pickField } = useLanguage()

  const list = useListParams(DEFAULTS)
  // unknown ?status= / ?type= values behave like "All"
  const status = STATUSES.includes(list.params.status) ? list.params.status : ''
  const type = TYPES.includes(list.params.type) ? list.params.type : ''
  const params = useMemo(() => ({ ...list.params, status, type }), [list.params, status, type])
  const paramsKey = JSON.stringify(params)

  const query = offerRequests.useList(params)
  const { rows, meta } = query
  const update = offerRequests.useUpdate()
  const remove = offerRequests.useDelete()
  const bulk = useBulkOfferRequests()

  const [selected, setSelected] = useState([])
  useEffect(() => setSelected([]), [paramsKey]) // a selection belongs to the page it was made on

  const options = useMemo(() => statusOptions(c), [c])
  const tab = status || 'all'
  const tabs = [{ key: 'all', label: c.all }, ...STATUSES.map((value) => ({ key: value, label: c.statusLabels[value] }))]

  const statusOf = (row) => (update.isPending && update.variables?.id === row.id ? update.variables.data.status : row.status)
  const offerName = (row) => (row.offer ? pickField(row.offer, 'title') : row.offer_title)

  const onDelete = async (row) => {
    const ok = await confirm({ title: t.deleteTitle, message: t.deleteMessage(row.name), confirmLabel: c.delete })
    if (ok) remove.mutate(row.id)
  }
  const applyBulkStatus = (next) => bulk.mutate({ action: 'status', ids: selected, status: next }, { onSuccess: () => setSelected([]) })
  const deleteSelected = async () => {
    const ok = await confirm({ title: t.bulkDeleteTitle, message: t.bulkDeleteMessage(selected.length), confirmLabel: c.delete })
    if (ok) bulk.mutate({ action: 'delete', ids: selected }, { onSuccess: () => setSelected([]) })
  }

  const columns = [
    {
      key: 'name',
      header: t.name,
      sortable: true,
      cell: (row) => (
        <div className="flex min-w-0 max-w-[14rem] items-start gap-2.5">
          <span aria-hidden="true" className={cx('mt-1.5 size-2 shrink-0 rounded-full', row.status === 'new' && 'bg-gold')} />
          <div className="min-w-0">
            <Link
              to={`/offer-requests/${row.id}`}
              onClick={stop}
              dir="auto"
              className="inline-block max-w-full truncate rounded align-bottom font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light"
            >
              {row.name}
            </Link>
            <p dir="ltr" className="text-start text-xs text-muted">
              {row.phone}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'type', header: t.type, sortable: true, cell: (row) => <TypeBadge type={row.type} /> },
    {
      key: 'offer_title',
      header: t.offer,
      sortable: true,
      hideBelow: 'md',
      cell: (row) => (
        <div className="min-w-0 max-w-[12rem]">
          <p className="truncate" dir="auto">
            {offerName(row)}
          </p>
          {row.plan ? (
            <p className="truncate text-xs text-muted" dir="auto">
              {row.plan}
            </p>
          ) : null}
        </div>
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
    { key: 'view', label: t.view, icon: Eye, to: `/offer-requests/${row.id}` },
    { key: 'delete', label: c.delete, icon: Trash2, tone: 'danger', onClick: () => onDelete(row), disabled: remove.isPending },
  ]

  return (
    <>
      <PageHeader title={t.title} description={t.description} />

      <Tabs idPrefix="offer-requests" label={t.statusTabs} tabs={tabs} value={tab} onChange={(key) => list.set({ status: key === 'all' ? '' : key })} />

      <TabPanel idPrefix="offer-requests" value={tab} active={tab} className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput dir={dir} value={list.params.search ?? ''} onChange={(search) => list.set({ search })} placeholder={t.searchPlaceholder} />
          <Select
            aria-label={t.typeFilter}
            value={type}
            onChange={(event) => list.set({ type: event.target.value })}
            options={[{ value: '', label: t.allTypes }, ...TYPES.map((value) => ({ value, label: t.types[value] }))]}
            wrapperClassName="w-full sm:w-44"
          />
          {list.hasFilters ? (
            <Button variant="ghost" size="sm" onClick={list.reset}>
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
              onRowClick={(row) => navigate(`/offer-requests/${row.id}`)}
              caption={t.title}
              minWidth={640}
              emptyIcon={ShoppingBag}
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
