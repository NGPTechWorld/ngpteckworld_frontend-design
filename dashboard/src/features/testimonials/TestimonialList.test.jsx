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

const { default: TestimonialList } = await import('./TestimonialList')

const makeTestimonial = (id, over = {}) => ({
  id,
  name: `Client ${id}`,
  company: `Company ${id}`,
  quote_ar: `رأي ${id}`,
  quote_en: `Quote ${id}`,
  rating: 5,
  avatar: null,
  avatar_url: null,
  is_active: true,
  order: id,
  created_at: '2026-09-01T10:00:00.000000Z',
  updated_at: '2026-09-01T10:00:00.000000Z',
  ...over,
})
const testimonials = [
  makeTestimonial(1, { rating: 4, avatar: 'testimonials/one.png', avatar_url: 'http://localhost/media/testimonials/one.png' }),
  makeTestimonial(2, { is_active: false, company: null, rating: 2 }),
  makeTestimonial(3),
]

function listServer(extra = {}) {
  return mockApi({ 'GET /testimonials': () => paginated(testimonials, { perPage: 15 }), ...extra })
}
const lastList = (server) => server.calls('GET', '/testimonials').at(-1).query
const rowOf = (name) => screen.getByText(name).closest('tr')

describe('TestimonialList', () => {
  it('shows a skeleton first, then avatar, name, company, stars and the active switch of every row', async () => {
    listServer()
    renderWithProviders(<TestimonialList />, { route: '/testimonials' })

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByText('Client 1')).toBeInTheDocument()
    expect(screen.getByText('Showing 1–3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Testimonials' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New testimonial' })).toHaveAttribute('href', '/testimonials/new')

    const first = rowOf('Client 1')
    expect(within(first).getByText('Company 1')).toBeInTheDocument()
    expect(within(first).getByText('Quote 1')).toBeInTheDocument() // excerpt in the UI language
    expect(within(first).getByRole('img', { name: '4 out of 5 stars' })).toBeInTheDocument()
    expect(first.querySelector('img[src="http://localhost/media/testimonials/one.png"]')).not.toBeNull()
    expect(within(first).getByRole('switch', { name: 'Active: Client 1' })).toHaveAttribute('aria-checked', 'true')

    const second = rowOf('Client 2')
    expect(within(second).getByRole('img', { name: '2 out of 5 stars' })).toBeInTheDocument()
    expect(within(second).getByRole('switch', { name: 'Active: Client 2' })).toHaveAttribute('aria-checked', 'false')
    expect(within(second).getByText('—')).toBeInTheDocument() // no company
    expect(within(second).getByText('C')).toBeInTheDocument() // initial instead of a missing avatar
  })

  it('renders in Arabic with Arabic column names, rating text and the Arabic quote', async () => {
    listServer()
    renderWithProviders(<TestimonialList />, { route: '/testimonials', lang: 'ar' })

    expect(await screen.findByText('Client 1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'آراء العملاء' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /العميل/ })).toBeInTheDocument()
    expect(within(rowOf('Client 1')).getByRole('img', { name: '4 نجوم من 5' })).toBeInTheDocument()
    expect(within(rowOf('Client 1')).getByText('رأي 1')).toBeInTheDocument()
  })

  it('requests the first page ordered by `order` and links each row to its edit page', async () => {
    const server = listServer()
    renderWithProviders(<TestimonialList />, { route: '/testimonials' })
    await screen.findByText('Client 1')

    expect(lastList(server)).toEqual({ page: '1', per_page: '15', sort: 'order', dir: 'asc' })
    expect(within(rowOf('Client 2')).getAllByRole('cell')[0]).toHaveTextContent('2')
    expect(within(rowOf('Client 2')).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/testimonials/2')
  })

  it('searches (debounced), keeps the term in the URL and resets to page 1', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials?page=2' })
    await screen.findByText('Client 1')

    await user.type(screen.getByRole('searchbox'), 'acme')

    await waitFor(() => expect(lastList(server).search).toBe('acme'))
    expect(lastList(server).page).toBe('1')
    expect(screen.getByTestId('location')).toHaveTextContent('/testimonials?search=acme')
  })

  it('filters by active / inactive and can reset the filters', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials' })
    await screen.findByText('Client 1')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), '0')

    await waitFor(() => expect(lastList(server).is_active).toBe('0'))
    expect(screen.getByTestId('location')).toHaveTextContent('/testimonials?is_active=0')

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(lastList(server).is_active).toBeUndefined())
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/testimonials$/)
  })

  it('sorts by name, company, rating and status (all allowed by the API), never by the quote', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials' })
    await screen.findByText('Client 1')

    expect(screen.queryByRole('button', { name: /Quote/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Client/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'name', dir: 'asc' }))

    await user.click(screen.getByRole('button', { name: /Company/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'company', dir: 'asc' }))

    await user.click(screen.getByRole('button', { name: /Rating/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'rating', dir: 'asc' }))
    await user.click(screen.getByRole('button', { name: /Rating/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'rating', dir: 'desc' }))
    expect(screen.getByRole('columnheader', { name: /Rating/ })).toHaveAttribute('aria-sort', 'descending')

    await user.click(screen.getByRole('button', { name: /Status/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'is_active', dir: 'asc' }))
  })

  it('paginates', async () => {
    const server = mockApi({ 'GET /testimonials': ({ query }) => paginated(testimonials, { page: Number(query.page), perPage: 3, total: 9 }) })
    const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials' })
    await screen.findByText('Client 1')
    expect(screen.getByText('Showing 1–3 of 9')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Page 2' }))

    await waitFor(() => expect(lastList(server).page).toBe('2'))
    expect(screen.getByTestId('location')).toHaveTextContent('page=2')
  })

  describe('active toggle', () => {
    it('sends only is_active and shows the saved toast', async () => {
      const server = listServer({ 'PUT /testimonials/:id': ({ params, body }) => ({ data: { ...makeTestimonial(Number(params.id)), ...body } }) })
      const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials' })
      await screen.findByText('Client 1')

      await user.click(screen.getByRole('switch', { name: 'Active: Client 1' }))

      await waitFor(() => expect(server.calls('PUT', '/testimonials/1')).toHaveLength(1))
      expect(server.calls('PUT', '/testimonials/1')[0].body).toEqual({ is_active: false })
      expect(await screen.findByText('Saved')).toBeInTheDocument()
    })

    it('activates an inactive one and reflects the requested value while the request runs', async () => {
      let release
      const gate = new Promise((resolve) => {
        release = resolve
      })
      const server = listServer({
        'PUT /testimonials/:id': async ({ params, body }) => {
          await gate
          return { data: { ...makeTestimonial(Number(params.id)), ...body } }
        },
      })
      const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials' })
      await screen.findByText('Client 2')
      const toggle = screen.getByRole('switch', { name: 'Active: Client 2' })
      expect(toggle).toHaveAttribute('aria-checked', 'false')

      await user.click(toggle)

      expect(toggle).toHaveAttribute('aria-checked', 'true')
      release()
      await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument())
      expect(server.calls('PUT', '/testimonials/2')[0].body).toEqual({ is_active: true })
    })

    it('shows an error toast when the update fails', async () => {
      listServer({ 'PUT /testimonials/:id': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials' })
      await screen.findByText('Client 1')

      await user.click(screen.getByRole('switch', { name: 'Active: Client 1' }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    })
  })

  describe('delete', () => {
    it('asks first, then deletes and refreshes the list', async () => {
      const server = listServer({ 'DELETE /testimonials/:id': () => null })
      const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials' })
      await screen.findByText('Client 2')

      await user.click(within(rowOf('Client 2')).getByRole('button', { name: 'Delete' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete testimonial' })
      expect(dialog).toHaveTextContent('Delete the testimonial from “Client 2”? This cannot be undone.')
      expect(server.calls('DELETE')).toHaveLength(0)

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(server.calls('DELETE', '/testimonials/2')).toHaveLength(1))
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/testimonials').length).toBeGreaterThan(1))
    })

    it('does nothing when the dialog is cancelled', async () => {
      const server = listServer({ 'DELETE /testimonials/:id': () => null })
      const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials' })
      await screen.findByText('Client 2')

      await user.click(within(rowOf('Client 2')).getByRole('button', { name: 'Delete' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(server.calls('DELETE')).toHaveLength(0)
    })

    it('shows an error toast when the delete fails', async () => {
      listServer({ 'DELETE /testimonials/:id': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials' })
      await screen.findByText('Client 2')

      await user.click(within(rowOf('Client 2')).getByRole('button', { name: 'Delete' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    })
  })

  describe('empty and error states', () => {
    it('invites to create the first testimonial when there are none', async () => {
      mockApi({ 'GET /testimonials': () => paginated([]) })
      renderWithProviders(<TestimonialList />, { route: '/testimonials' })

      expect(await screen.findByText('No testimonials yet')).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'New testimonial' })).toHaveLength(2) // header + empty state
    })

    it('explains an empty search / filter result instead', async () => {
      mockApi({ 'GET /testimonials': () => paginated([]) })
      renderWithProviders(<TestimonialList />, { route: '/testimonials?is_active=0' })

      expect(await screen.findByText('No results')).toBeInTheDocument()
      expect(screen.queryByText('No testimonials yet')).not.toBeInTheDocument()
    })

    it('shows a retryable error when the list cannot be loaded', async () => {
      const server = mockApi({ 'GET /testimonials': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials' })

      expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()

      server.on('GET /testimonials', () => paginated(testimonials))
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(await screen.findByText('Client 1')).toBeInTheDocument()
    })
  })

  describe('reorder mode', () => {
    it('loads every row (per_page 200), reorders optimistically and saves the new order', async () => {
      // a stateful fake: the reorder endpoint changes what the next GET returns, like the real API
      let stored = [...testimonials]
      const server = mockApi({
        'GET /testimonials': () => paginated(stored),
        'POST /testimonials/reorder': ({ body }) => {
          stored = body.ids.map((id) => stored.find((row) => row.id === id))
          return null
        },
      })
      const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials' })
      await screen.findByText('Client 1')

      await user.click(screen.getByRole('button', { name: 'Reorder' }))

      await waitFor(() => expect(lastList(server)).toEqual({ per_page: '200', sort: 'order', dir: 'asc' }))
      const list = await screen.findByRole('list', { name: 'Testimonials' })
      expect(within(list).getAllByRole('listitem')).toHaveLength(3)
      expect(within(list).getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(3)
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()

      act(() => dnd.props.onDragEnd({ active: { id: 1 }, over: { id: 3 } })) // drop #1 on #3

      await waitFor(() => expect(server.calls('POST', '/testimonials/reorder')).toHaveLength(1))
      expect(server.calls('POST', '/testimonials/reorder')[0].body).toEqual({ ids: [2, 3, 1] })
      const names = within(screen.getByRole('list', { name: 'Testimonials' })).getAllByRole('listitem').map((item) => within(item).getByText(/Client \d/).textContent)
      expect(names).toEqual(['Client 2', 'Client 3', 'Client 1'])
      expect(await screen.findByText('Order saved')).toBeInTheDocument()
    })

    it('"Done" returns to the table', async () => {
      listServer()
      const { user } = renderWithProviders(<TestimonialList />, { route: '/testimonials' })
      await screen.findByText('Client 1')
      await user.click(screen.getByRole('button', { name: 'Reorder' }))
      await screen.findByRole('list', { name: 'Testimonials' })

      await user.click(screen.getByRole('button', { name: 'Done' }))

      expect(await screen.findByRole('table')).toBeInTheDocument()
    })

    it('is unavailable when there are more rows than one page can hold', async () => {
      mockApi({ 'GET /testimonials': () => paginated(testimonials, { perPage: 15, total: 500 }) })
      renderWithProviders(<TestimonialList />, { route: '/testimonials' })
      await screen.findByText('Client 1')

      expect(screen.getByRole('button', { name: 'Reorder' })).toBeDisabled()
    })
  })
})
