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

const { default: ServiceList } = await import('./ServiceList')

const makeService = (id, over = {}) => ({
  id,
  icon_key: 'web',
  title_ar: `خدمة ${id}`,
  title_en: `Service ${id}`,
  description_ar: 'وصف',
  description_en: 'Description',
  features_ar: [],
  features_en: [],
  is_active: true,
  order: id,
  created_at: '2026-09-01T10:00:00.000000Z',
  updated_at: '2026-09-01T10:00:00.000000Z',
  ...over,
})
const services = [
  makeService(1, { icon_key: 'web', features_ar: ['ميزة'], features_en: ['One', 'Two', 'Three'] }),
  makeService(2, { icon_key: 'cloud' }),
  makeService(3, { icon_key: 'ai', features_en: ['Only English'] }),
]

function listServer(extra = {}) {
  return mockApi({ 'GET /services': () => paginated(services, { perPage: 15 }), ...extra })
}
const lastList = (server) => server.calls('GET', '/services').at(-1).query

describe('ServiceList', () => {
  it('shows a skeleton first, then the services with both languages, icon and feature count', async () => {
    listServer()
    renderWithProviders(<ServiceList />, { route: '/services' })

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByText('Service 1')).toBeInTheDocument()
    expect(screen.getByText('خدمة 1')).toBeInTheDocument() // the other language, smaller
    expect(screen.getByText('Showing 1–3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Services' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New service' })).toHaveAttribute('href', '/services/new')

    const row = screen.getByText('Service 1').closest('tr')
    expect(within(row).getByRole('img', { name: 'Web' })).toBeInTheDocument()
    expect(within(row).getAllByRole('cell')[2]).toHaveTextContent('3') // English UI counts the English features
    expect(within(screen.getByText('Service 2').closest('tr')).getByRole('img', { name: 'Cloud' })).toBeInTheDocument()
    expect(within(screen.getByText('Service 2').closest('tr')).getAllByRole('cell')[2]).toHaveTextContent('0')
  })

  it('shows the Arabic title first and counts the Arabic features in the Arabic UI', async () => {
    listServer()
    renderWithProviders(<ServiceList />, { route: '/services', lang: 'ar' })

    expect(await screen.findByText('خدمة 1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'الخدمات' })).toBeInTheDocument()
    expect(screen.getByText('Service 1')).toHaveAttribute('dir', 'ltr')
    expect(within(screen.getByText('خدمة 1').closest('tr')).getAllByRole('cell')[2]).toHaveTextContent('1') // one Arabic feature
    expect(within(screen.getByText('خدمة 1').closest('tr')).getByRole('img', { name: 'مواقع الويب' })).toBeInTheDocument()
  })

  it('numbers the rows by their position and links each row to its edit page', async () => {
    const server = listServer()
    renderWithProviders(<ServiceList />, { route: '/services' })
    await screen.findByText('Service 1')

    expect(lastList(server)).toEqual({ page: '1', per_page: '15', sort: 'order', dir: 'asc' })
    const row = screen.getByText('Service 2').closest('tr')
    expect(within(row).getAllByRole('cell')[0]).toHaveTextContent('2')
    expect(within(row).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/services/2')
  })

  it('searches (debounced), keeps the term in the URL and resets to page 1', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<ServiceList />, { route: '/services?page=2' })
    await screen.findByText('Service 1')

    await user.type(screen.getByRole('searchbox'), 'cloud')

    await waitFor(() => expect(lastList(server).search).toBe('cloud'))
    expect(lastList(server).page).toBe('1')
    expect(screen.getByTestId('location')).toHaveTextContent('/services?search=cloud')
  })

  it('sorts only by columns the API allows (title in the UI language, order, created)', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<ServiceList />, { route: '/services' })
    await screen.findByText('Service 1')

    expect(screen.queryByRole('button', { name: /Features/ })).not.toBeInTheDocument() // the API cannot sort by it

    await user.click(screen.getByRole('button', { name: /Service$/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'title_en', dir: 'asc' }))

    await user.click(screen.getByRole('button', { name: /Created/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'created_at', dir: 'asc' }))
    expect(screen.getByRole('columnheader', { name: /Created/ })).toHaveAttribute('aria-sort', 'ascending')
  })

  it('sorts by the Arabic title in the Arabic UI', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<ServiceList />, { route: '/services', lang: 'ar' })
    await screen.findByText('خدمة 1')

    await user.click(screen.getByRole('button', { name: /^الخدمة/ }))

    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'title_ar', dir: 'asc' }))
  })

  it('hides the position numbers while the list is not sorted by order', async () => {
    listServer()
    renderWithProviders(<ServiceList />, { route: '/services?sort=created_at&dir=desc' })
    await screen.findByText('Service 1')

    expect(within(screen.getByText('Service 2').closest('tr')).getAllByRole('cell')[0]).toHaveTextContent('—')
  })

  it('counts positions from the end when sorted by order descending', async () => {
    listServer()
    renderWithProviders(<ServiceList />, { route: '/services?sort=order&dir=desc' })
    await screen.findByText('Service 1')

    expect(within(screen.getByText('Service 1').closest('tr')).getAllByRole('cell')[0]).toHaveTextContent('3')
    expect(within(screen.getByText('Service 3').closest('tr')).getAllByRole('cell')[0]).toHaveTextContent('1')
  })

  it('paginates', async () => {
    const server = mockApi({ 'GET /services': ({ query }) => paginated(services, { page: Number(query.page), perPage: 3, total: 9 }) })
    const { user } = renderWithProviders(<ServiceList />, { route: '/services' })
    await screen.findByText('Service 1')
    expect(screen.getByText('Showing 1–3 of 9')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Page 2' }))

    await waitFor(() => expect(lastList(server).page).toBe('2'))
    expect(screen.getByTestId('location')).toHaveTextContent('page=2')
  })

  describe('delete', () => {
    it('asks first, then deletes and refreshes the list', async () => {
      const server = listServer({ 'DELETE /services/:id': () => null })
      const { user } = renderWithProviders(<ServiceList />, { route: '/services' })
      await screen.findByText('Service 2')

      await user.click(within(screen.getByText('Service 2').closest('tr')).getByRole('button', { name: 'Delete' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete service' })
      expect(dialog).toHaveTextContent('Delete the service “Service 2”? This cannot be undone.')
      expect(server.calls('DELETE')).toHaveLength(0)

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(server.calls('DELETE', '/services/2')).toHaveLength(1))
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/services').length).toBeGreaterThan(1))
    })

    it('does nothing when the dialog is cancelled', async () => {
      const server = listServer({ 'DELETE /services/:id': () => null })
      const { user } = renderWithProviders(<ServiceList />, { route: '/services' })
      await screen.findByText('Service 2')

      await user.click(within(screen.getByText('Service 2').closest('tr')).getByRole('button', { name: 'Delete' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(server.calls('DELETE')).toHaveLength(0)
    })

    it('shows an error toast when the delete fails', async () => {
      listServer({ 'DELETE /services/:id': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<ServiceList />, { route: '/services' })
      await screen.findByText('Service 2')

      await user.click(within(screen.getByText('Service 2').closest('tr')).getByRole('button', { name: 'Delete' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    })
  })

  describe('empty and error states', () => {
    it('invites to create the first service when there are none', async () => {
      mockApi({ 'GET /services': () => paginated([]) })
      renderWithProviders(<ServiceList />, { route: '/services' })

      expect(await screen.findByText('No services yet')).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'New service' })).toHaveLength(2) // header + empty state
    })

    it('explains an empty search result instead', async () => {
      mockApi({ 'GET /services': () => paginated([]) })
      renderWithProviders(<ServiceList />, { route: '/services?search=zzz' })

      expect(await screen.findByText('No results')).toBeInTheDocument()
      expect(screen.queryByText('No services yet')).not.toBeInTheDocument()
    })

    it('shows a retryable error when the list cannot be loaded', async () => {
      const server = mockApi({ 'GET /services': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<ServiceList />, { route: '/services' })

      expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()

      server.on('GET /services', () => paginated(services))
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(await screen.findByText('Service 1')).toBeInTheDocument()
    })
  })

  describe('reorder mode', () => {
    it('loads every row (per_page 200), reorders optimistically and saves the new order', async () => {
      // a stateful fake: the reorder endpoint changes what the next GET returns, like the real API
      let stored = [...services]
      const server = mockApi({
        'GET /services': () => paginated(stored),
        'POST /services/reorder': ({ body }) => {
          stored = body.ids.map((id) => stored.find((row) => row.id === id))
          return null
        },
      })
      const { user } = renderWithProviders(<ServiceList />, { route: '/services' })
      await screen.findByText('Service 1')

      await user.click(screen.getByRole('button', { name: 'Reorder' }))

      await waitFor(() => expect(lastList(server)).toEqual({ per_page: '200', sort: 'order', dir: 'asc' }))
      const list = await screen.findByRole('list', { name: 'Services' })
      expect(within(list).getAllByRole('listitem')).toHaveLength(3)
      expect(within(list).getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(3)
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()

      act(() => dnd.props.onDragEnd({ active: { id: 1 }, over: { id: 3 } })) // drop #1 on #3

      await waitFor(() => expect(server.calls('POST', '/services/reorder')).toHaveLength(1))
      expect(server.calls('POST', '/services/reorder')[0].body).toEqual({ ids: [2, 3, 1] })
      const titles = within(screen.getByRole('list', { name: 'Services' })).getAllByRole('listitem').map((item) => within(item).getByText(/Service \d/).textContent)
      expect(titles).toEqual(['Service 2', 'Service 3', 'Service 1'])
      expect(await screen.findByText('Order saved')).toBeInTheDocument()
    })

    it('"Done" returns to the table', async () => {
      listServer()
      const { user } = renderWithProviders(<ServiceList />, { route: '/services' })
      await screen.findByText('Service 1')
      await user.click(screen.getByRole('button', { name: 'Reorder' }))
      await screen.findByRole('list', { name: 'Services' })

      await user.click(screen.getByRole('button', { name: 'Done' }))

      expect(await screen.findByRole('table')).toBeInTheDocument()
    })

    it('is unavailable when there are more rows than one page can hold', async () => {
      mockApi({ 'GET /services': () => paginated(services, { perPage: 15, total: 500 }) })
      renderWithProviders(<ServiceList />, { route: '/services' })
      await screen.findByText('Service 1')

      expect(screen.getByRole('button', { name: 'Reorder' })).toBeDisabled()
    })

    it('rolls the order back and toasts when saving fails', async () => {
      const server = mockApi({ 'GET /services': () => paginated(services), 'POST /services/reorder': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<ServiceList />, { route: '/services' })
      await screen.findByText('Service 1')
      await user.click(screen.getByRole('button', { name: 'Reorder' }))
      await screen.findByRole('list', { name: 'Services' })

      act(() => dnd.props.onDragEnd({ active: { id: 1 }, over: { id: 2 } }))

      await waitFor(() => expect(server.calls('POST', '/services/reorder')).toHaveLength(1))
      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
      await waitFor(() => {
        const titles = within(screen.getByRole('list', { name: 'Services' })).getAllByRole('listitem').map((item) => within(item).getByText(/Service \d/).textContent)
        expect(titles).toEqual(['Service 1', 'Service 2', 'Service 3'])
      })
    })
  })

  describe('active toggle', () => {
    it('hides a service from the website with one click', async () => {
      const server = listServer({ 'PUT /services/:id': ({ params, body }) => ({ data: { ...makeService(Number(params.id)), ...body } }) })
      const { user } = renderWithProviders(<ServiceList />, { route: '/services' })
      await screen.findByText('Service 1')

      await user.click(screen.getByRole('switch', { name: 'Active: Service 1' }))

      await waitFor(() => expect(server.calls('PUT', '/services/1')).toHaveLength(1))
      expect(server.calls('PUT', '/services/1')[0].body).toEqual({ is_active: false })
      expect(await screen.findByText('Saved')).toBeInTheDocument()
    })

    it('filters by status through the URL', async () => {
      const server = listServer()
      const { user } = renderWithProviders(<ServiceList />, { route: '/services' })
      await screen.findByText('Service 1')

      await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), '0')

      await waitFor(() => expect(lastList(server).is_active).toBe('0'))
      expect(screen.getByTestId('location')).toHaveTextContent('/services?is_active=0')
    })
  })
})
