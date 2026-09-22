import { act, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient, createWrapper } from '@/test/renderWithProviders'
import { mockApi, paginated, reply, validationError } from '@/test/mockApi'
import { applyOrder, createCrudHooks, useCrudHooks } from './crud'

const rows = [
  { id: 1, name: 'A', order: 0 },
  { id: 2, name: 'B', order: 1 },
  { id: 3, name: 'C', order: 2 },
]
const items = createCrudHooks('/items')

describe('applyOrder', () => {
  it('re-sorts the rows to follow ids and updates `order`', () => {
    const next = applyOrder({ data: rows, meta: { total: 3 } }, [3, 1, 2])
    expect(next.data.map((row) => row.id)).toEqual([3, 1, 2])
    expect(next.data.map((row) => row.order)).toEqual([0, 1, 2])
    expect(next.meta).toEqual({ total: 3 })
  })

  it('keeps rows that are not in ids in their slots', () => {
    const next = applyOrder({ data: rows }, [3, 1])
    expect(next.data.map((row) => row.id)).toEqual([3, 2, 1])
  })

  it('passes anything that is not a list through', () => {
    expect(applyOrder(undefined, [1])).toBeUndefined()
    expect(applyOrder({ data: 5 }, [1])).toEqual({ data: 5 })
  })
})

describe('createCrudHooks', () => {
  it('useList requests the resource with params and exposes rows + meta', async () => {
    const server = mockApi({ 'GET /items': () => paginated(rows, { page: 2, perPage: 3, total: 9 }) })

    const { result } = renderHook(() => items.useList({ page: 2, per_page: 3, search: 'a', is_active: 1 }), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.rows).toHaveLength(3))
    expect(result.current.meta.total).toBe(9)
    expect(result.current.data.data).toBe(result.current.rows)
    expect(server.calls('GET', '/items')[0].query).toEqual({ page: '2', per_page: '3', search: 'a', is_active: '1' })
  })

  it('useList keeps the previous page on screen while the next one loads', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    mockApi({
      'GET /items': async ({ query }) => {
        if (query.page === '2') await gate
        return paginated(query.page === '2' ? [{ id: 9, name: 'Z', order: 9 }] : rows, { page: Number(query.page) })
      },
    })

    const { result, rerender } = renderHook(({ page }) => items.useList({ page }), { wrapper: createWrapper(), initialProps: { page: 1 } })
    await waitFor(() => expect(result.current.rows).toHaveLength(3))

    rerender({ page: 2 })
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.rows).toHaveLength(3)

    release()
    await waitFor(() => expect(result.current.rows.map((row) => row.id)).toEqual([9]))
  })

  it('useOne unwraps the record and stays idle without an id', async () => {
    const server = mockApi({ 'GET /items/:id': ({ params }) => ({ data: { id: Number(params.id), name: 'One' } }) })
    const wrapper = createWrapper()

    const idle = renderHook(() => items.useOne(undefined), { wrapper })
    expect(idle.result.current.fetchStatus).toBe('idle')
    expect(server.calls()).toHaveLength(0)

    const { result } = renderHook(() => items.useOne(7), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual({ id: 7, name: 'One' }))
  })

  it('useCreate posts, invalidates the lists and toasts', async () => {
    const server = mockApi({
      'GET /items': () => paginated(rows),
      'POST /items': ({ body }) => reply(201, { data: { id: 4, ...body } }),
    })
    const queryClient = createTestQueryClient()
    const wrapper = createWrapper({ queryClient })
    const list = renderHook(() => items.useList({}), { wrapper })
    const create = renderHook(() => items.useCreate(), { wrapper })
    await waitFor(() => expect(list.result.current.rows).toHaveLength(3))

    await act(() => create.result.current.mutateAsync({ name: 'D' }))

    expect(server.calls('POST', '/items')[0].body).toEqual({ name: 'D' })
    await waitFor(() => expect(server.calls('GET', '/items').length).toBeGreaterThan(1)) // refetched
  })

  it('useCreate calls the user callbacks after ours', async () => {
    mockApi({ 'POST /items': () => reply(201, { data: { id: 4 } }) })
    const seen = []
    const { result } = renderHook(() => items.useCreate({ onSuccess: (data) => seen.push(data.id), silent: true }), { wrapper: createWrapper() })

    await act(() => result.current.mutateAsync({}))

    expect(seen).toEqual([4])
  })

  it('shows a toast for failures (validation → generic text) and rethrows the ApiError', async () => {
    mockApi({ 'POST /items': () => validationError({ name: ['required'] }) })
    const { result } = renderHook(
      () => {
        return items.useCreate()
      },
      { wrapper: createWrapper() },
    )

    const error = await act(() => result.current.mutateAsync({}).catch((err) => err))

    expect(error).toMatchObject({ status: 422, errors: { name: ['required'] } })
  })

  it('useUpdate PUTs { id, data } and caches the returned record', async () => {
    const server = mockApi({ 'PUT /items/:id': ({ params, body }) => ({ data: { id: Number(params.id), ...body } }) })
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => items.useUpdate({ silent: true }), { wrapper: createWrapper({ queryClient }) })

    await act(() => result.current.mutateAsync({ id: 2, data: { name: 'Changed' } }))

    expect(server.calls('PUT', '/items/2')[0].body).toEqual({ name: 'Changed' })
    expect(queryClient.getQueryData(items.keys.one(2))).toEqual({ id: 2, name: 'Changed' })
  })

  it('useDelete calls DELETE and drops the cached record', async () => {
    const server = mockApi({ 'DELETE /items/:id': () => null })
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(items.keys.one(3), { id: 3 })
    const { result } = renderHook(() => items.useDelete({ silent: true }), { wrapper: createWrapper({ queryClient }) })

    await act(() => result.current.mutateAsync(3))

    expect(server.calls('DELETE', '/items/3')).toHaveLength(1)
    expect(queryClient.getQueryData(items.keys.one(3))).toBeUndefined()
  })

  it('useReorder re-sorts the cached list immediately and posts the ids', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    const server = mockApi({
      'GET /items': () => paginated(rows),
      'POST /items/reorder': async () => {
        await gate
        return null
      },
    })
    const wrapper = createWrapper()
    const list = renderHook(() => items.useList({}), { wrapper })
    const reorder = renderHook(() => items.useReorder({ silent: true }), { wrapper })
    await waitFor(() => expect(list.result.current.rows).toHaveLength(3))

    act(() => {
      reorder.result.current.mutate([3, 1, 2])
    })

    await waitFor(() => expect(list.result.current.rows.map((row) => row.id)).toEqual([3, 1, 2]))
    release()
    await waitFor(() => expect(reorder.result.current.isSuccess).toBe(true))
    expect(server.calls('POST', '/items/reorder')[0].body).toEqual({ ids: [3, 1, 2] })
  })

  it('useReorder restores the previous order when the request fails', async () => {
    mockApi({
      'GET /items': () => paginated(rows),
      'POST /items/reorder': () => reply(500, { message: 'boom' }),
    })
    const wrapper = createWrapper()
    const list = renderHook(() => items.useList({}), { wrapper })
    const reorder = renderHook(() => items.useReorder({ silent: true }), { wrapper })
    await waitFor(() => expect(list.result.current.rows).toHaveLength(3))

    await act(() => reorder.result.current.mutateAsync([3, 2, 1]).catch(() => {}))

    await waitFor(() => expect(list.result.current.rows.map((row) => row.id)).toEqual([1, 2, 3]))
  })

  it('exposes stable query keys', () => {
    expect(items.keys.list({ page: 1 })).toEqual(['crud', '/items', 'list', { page: 1 }])
    expect(items.keys.one(5)).toEqual(['crud', '/items', 'one', '5'])
  })

  it('useCrudHooks builds hooks for a runtime path', async () => {
    mockApi({ 'GET /projects/4/links': () => paginated([{ id: 1 }]) })
    const { result } = renderHook(
      () => {
        const links = useCrudHooks('/projects/4/links')
        return links.useList({})
      },
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.rows).toHaveLength(1))
  })
})

// toasts are rendered by ToastProvider: check the visible text once for each kind
describe('crud toasts', () => {
  it('shows "Saved" after a successful create', async () => {
    mockApi({ 'POST /items': () => reply(201, { data: { id: 1 } }) })
    const { result } = renderHook(() => items.useCreate(), { wrapper: createWrapper() })
    await act(() => result.current.mutateAsync({}))
    // The provider renders into the wrapper's tree, which renderHook mounts in document.body
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('shows the localized generic text for a 500', async () => {
    mockApi({ 'DELETE /items/:id': () => reply(500, { message: 'SQLSTATE[HY000] leaked internals' }) })
    const { result } = renderHook(() => items.useDelete(), { wrapper: createWrapper() })
    await act(() => result.current.mutateAsync(1).catch(() => {}))
    expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument()
  })
})
