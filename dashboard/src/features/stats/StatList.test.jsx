import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockApi, paginated, reply } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'

// dnd-kit needs real layout for a drag: capture its props and fire the drop ourselves
const dnd = vi.hoisted(() => ({ props: null }))
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    DndContext: (props) => {
      dnd.props = props
      return <actual.DndContext {...props} />
    },
  }
})

const { default: StatList } = await import('./StatList')

const makeStat = (id, over = {}) => ({
  id,
  value: `${id}00+`,
  label_ar: `تسمية ${id}`,
  label_en: `Label ${id}`,
  order: id,
  created_at: '2026-09-01T10:00:00.000000Z',
  updated_at: '2026-09-01T10:00:00.000000Z',
  ...over,
})
const stats = [makeStat(1), makeStat(2, { value: '98%' }), makeStat(3)]

function listServer(extra = {}) {
  return mockApi({ 'GET /stats': () => paginated(stats, { perPage: 15 }), ...extra })
}
const lastList = (server) => server.calls('GET', '/stats').at(-1).query

describe('StatList', () => {
  it('shows a skeleton first, then the value and both labels of every stat', async () => {
    listServer()
    renderWithProviders(<StatList />, { route: '/stats' })

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByText('Label 1')).toBeInTheDocument()
    expect(screen.getByText('تسمية 1')).toBeInTheDocument() // the other language, smaller
    expect(screen.getByText('100+')).toHaveAttribute('dir', 'ltr')
    expect(screen.getByText('98%')).toBeInTheDocument()
    expect(screen.getByText('Showing 1–3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Stats' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New stat' })).toHaveAttribute('href', '/stats/new')
  })

  it('shows the Arabic label first in the Arabic UI', async () => {
    listServer()
    renderWithProviders(<StatList />, { route: '/stats', lang: 'ar' })

    expect(await screen.findByText('تسمية 1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'الإحصائيات' })).toBeInTheDocument()
    expect(screen.getByText('Label 1')).toHaveAttribute('dir', 'ltr')
  })

  it('numbers the rows by position and links each row to its edit page', async () => {
    const server = listServer()
    renderWithProviders(<StatList />, { route: '/stats' })
    await screen.findByText('Label 1')

    expect(lastList(server)).toEqual({ page: '1', per_page: '15', sort: 'order', dir: 'asc' })
    const row = screen.getByText('Label 2').closest('tr')
    expect(within(row).getAllByRole('cell')[0]).toHaveTextContent('2')
    expect(within(row).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/stats/2')
  })

  it('searches (debounced), keeps the term in the URL and resets to page 1', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<StatList />, { route: '/stats?page=2' })
    await screen.findByText('Label 1')

    await user.type(screen.getByRole('searchbox'), '98')

    await waitFor(() => expect(lastList(server).search).toBe('98'))
    expect(lastList(server).page).toBe('1')
    expect(screen.getByTestId('location')).toHaveTextContent('/stats?search=98')
  })

  it('sorts only by columns the API allows (label in the UI language, order, created; never the value)', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<StatList />, { route: '/stats' })
    await screen.findByText('Label 1')

    expect(screen.queryByRole('button', { name: /Value/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Label/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'label_en', dir: 'asc' }))

    await user.click(screen.getByRole('button', { name: /Created/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'created_at', dir: 'asc' }))
  })

  it('sorts by the Arabic label in the Arabic UI', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<StatList />, { route: '/stats', lang: 'ar' })
    await screen.findByText('تسمية 1')

    await user.click(screen.getByRole('button', { name: /التسمية/ }))

    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'label_ar', dir: 'asc' }))
  })

  it('hides the position numbers while the list is not sorted by order', async () => {
    listServer()
    renderWithProviders(<StatList />, { route: '/stats?sort=created_at&dir=desc' })
    await screen.findByText('Label 1')

    expect(within(screen.getByText('Label 2').closest('tr')).getAllByRole('cell')[0]).toHaveTextContent('—')
  })

  it('paginates', async () => {
    const server = mockApi({ 'GET /stats': ({ query }) => paginated(stats, { page: Number(query.page), perPage: 3, total: 9 }) })
    const { user } = renderWithProviders(<StatList />, { route: '/stats' })
    await screen.findByText('Label 1')
    expect(screen.getByText('Showing 1–3 of 9')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Page 2' }))

    await waitFor(() => expect(lastList(server).page).toBe('2'))
  })

  describe('delete', () => {
    it('asks first, then deletes and refreshes the list', async () => {
      const server = listServer({ 'DELETE /stats/:id': () => null })
      const { user } = renderWithProviders(<StatList />, { route: '/stats' })
      await screen.findByText('Label 2')

      await user.click(within(screen.getByText('Label 2').closest('tr')).getByRole('button', { name: 'Delete' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete stat' })
      expect(dialog).toHaveTextContent('Delete the stat “98% — Label 2”? This cannot be undone.')
      expect(server.calls('DELETE')).toHaveLength(0)

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(server.calls('DELETE', '/stats/2')).toHaveLength(1))
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/stats').length).toBeGreaterThan(1))
    })

    it('does nothing when the dialog is cancelled', async () => {
      const server = listServer({ 'DELETE /stats/:id': () => null })
      const { user } = renderWithProviders(<StatList />, { route: '/stats' })
      await screen.findByText('Label 2')

      await user.click(within(screen.getByText('Label 2').closest('tr')).getByRole('button', { name: 'Delete' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(server.calls('DELETE')).toHaveLength(0)
    })

    it('shows an error toast when the delete fails', async () => {
      listServer({ 'DELETE /stats/:id': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<StatList />, { route: '/stats' })
      await screen.findByText('Label 2')

      await user.click(within(screen.getByText('Label 2').closest('tr')).getByRole('button', { name: 'Delete' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    })
  })

  describe('empty and error states', () => {
    it('invites to create the first stat when there are none', async () => {
      mockApi({ 'GET /stats': () => paginated([]) })
      renderWithProviders(<StatList />, { route: '/stats' })

      expect(await screen.findByText('No stats yet')).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'New stat' })).toHaveLength(2) // header + empty state
    })

    it('explains an empty search result instead', async () => {
      mockApi({ 'GET /stats': () => paginated([]) })
      renderWithProviders(<StatList />, { route: '/stats?search=zzz' })

      expect(await screen.findByText('No results')).toBeInTheDocument()
      expect(screen.queryByText('No stats yet')).not.toBeInTheDocument()
    })

    it('shows a retryable error when the list cannot be loaded', async () => {
      const server = mockApi({ 'GET /stats': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<StatList />, { route: '/stats' })

      expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()

      server.on('GET /stats', () => paginated(stats))
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(await screen.findByText('Label 1')).toBeInTheDocument()
    })
  })

  describe('reorder mode', () => {
    it('loads every row (per_page 200), reorders optimistically and saves the new order', async () => {
      // a stateful fake: the reorder endpoint changes what the next GET returns, like the real API
      let stored = [...stats]
      const server = mockApi({
        'GET /stats': () => paginated(stored),
        'POST /stats/reorder': ({ body }) => {
          stored = body.ids.map((id) => stored.find((row) => row.id === id))
          return null
        },
      })
      const { user } = renderWithProviders(<StatList />, { route: '/stats' })
      await screen.findByText('Label 1')

      await user.click(screen.getByRole('button', { name: 'Reorder' }))

      await waitFor(() => expect(lastList(server)).toEqual({ per_page: '200', sort: 'order', dir: 'asc' }))
      const list = await screen.findByRole('list', { name: 'Stats' })
      expect(within(list).getAllByRole('listitem')).toHaveLength(3)
      expect(within(list).getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(3)
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()

      act(() => dnd.props.onDragEnd({ active: { id: 3 }, over: { id: 1 } })) // drop #3 on #1

      await waitFor(() => expect(server.calls('POST', '/stats/reorder')).toHaveLength(1))
      expect(server.calls('POST', '/stats/reorder')[0].body).toEqual({ ids: [3, 1, 2] })
      const labels = within(screen.getByRole('list', { name: 'Stats' })).getAllByRole('listitem').map((item) => within(item).getByText(/Label \d/).textContent)
      expect(labels).toEqual(['Label 3', 'Label 1', 'Label 2'])
      expect(await screen.findByText('Order saved')).toBeInTheDocument()
    })

    it('"Done" returns to the table', async () => {
      listServer()
      const { user } = renderWithProviders(<StatList />, { route: '/stats' })
      await screen.findByText('Label 1')
      await user.click(screen.getByRole('button', { name: 'Reorder' }))
      await screen.findByRole('list', { name: 'Stats' })

      await user.click(screen.getByRole('button', { name: 'Done' }))

      expect(await screen.findByRole('table')).toBeInTheDocument()
    })

    it('is unavailable when there are more rows than one page can hold', async () => {
      mockApi({ 'GET /stats': () => paginated(stats, { perPage: 15, total: 500 }) })
      renderWithProviders(<StatList />, { route: '/stats' })
      await screen.findByText('Label 1')

      expect(screen.getByRole('button', { name: 'Reorder' })).toBeDisabled()
    })
  })
})
