import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const NUMERIC = new Set(['page', 'per_page'])

const isBlank = (value) => value === undefined || value === null || value === ''

/**
 * List-page state (page, per_page, sort, dir, search and any filter) kept in the URL query string, so refresh,
 * back/forward and links keep working. Only values that differ from `defaults` are written to the URL.
 *
 *   const list = useListParams({ per_page: 15, sort: 'order', dir: 'asc' })
 *   const { rows, meta } = faqs.useList(list.params)          // { page, per_page, sort, dir, search?, …filters }
 *   <SearchInput value={list.params.search ?? ''} onChange={(search) => list.set({ search })} />
 *   <Select value={list.params.is_active ?? ''} onChange={(e) => list.set({ is_active: e.target.value })} … />
 *   <DataTable sort={list.sort} onSortChange={list.setSort} … />
 *   <Pagination meta={meta} onPageChange={list.setPage} onPerPageChange={list.setPerPage} />
 *
 * `list.set(patch)` merges the patch and returns to page 1 unless the patch contains `page`.
 * `list.hasFilters` is true when search or any filter is active (use it to pick the empty-state message).
 * `defaults` should be a constant (declare it outside the component or pass a stable literal).
 */
export function useListParams(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultsKey = JSON.stringify(defaults)

  const params = useMemo(() => {
    const base = { page: 1, ...JSON.parse(defaultsKey) }
    for (const [key, raw] of searchParams.entries()) {
      base[key] = NUMERIC.has(key) ? Number(raw) || base[key] : raw
    }
    return base
  }, [searchParams, defaultsKey])

  const set = useCallback(
    (patch) => {
      const fixed = JSON.parse(defaultsKey)
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          const apply = (key, value) => {
            const isDefault = String(fixed[key] ?? (key === 'page' ? 1 : '')) === String(value)
            if (isBlank(value) || isDefault) next.delete(key)
            else next.set(key, String(value))
          }
          Object.entries(patch).forEach(([key, value]) => apply(key, value))
          if (!('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [defaultsKey, setSearchParams],
  )

  const setPage = useCallback((page) => set({ page }), [set])
  const setPerPage = useCallback((per_page) => set({ per_page }), [set])
  const setSort = useCallback(({ key, dir }) => set({ sort: key, dir }), [set])
  const reset = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams])

  const hasFilters = useMemo(
    () => Object.entries(params).some(([key, value]) => !['page', 'per_page', 'sort', 'dir'].includes(key) && !isBlank(value)),
    [params],
  )

  return { params, sort: { key: params.sort, dir: params.dir }, set, setPage, setPerPage, setSort, reset, hasFilters }
}
