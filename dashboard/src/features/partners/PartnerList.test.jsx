import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
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

const { default: PartnerList } = await import('./PartnerList')

const makePartner = (id, over = {}) => ({
  id,
  name: `Partner ${id}`,
  logo: null,
  logo_url: null,
  url: null,
  is_active: true,
  order: id,
  created_at: '2026-09-01T10:00:00.000000Z',
  updated_at: '2026-09-01T10:00:00.000000Z',
  ...over,
})
const partners = [
  makePartner(1, { logo: 'partners/one.png', logo_url: 'http://localhost/media/partners/one.png', url: 'https://www.one.example/about/' }),
  makePartner(2, { is_active: false }),
  makePartner(3, { url: 'javascript:alert(1)' }), // legacy row: must never become a link
]

function listServer(extra = {}) {
  return mockApi({ 'GET /partners': () => paginated(partners, { perPage: 15 }), ...extra })
}
const lastList = (server) => server.calls('GET', '/partners').at(-1).query
const rowOf = (name) => screen.getByText(name).closest('tr')

describe('PartnerList', () => {
  it('shows a skeleton first, then logo, name, website and the active switch of every row', async () => {
    listServer()
    renderWithProviders(<PartnerList />, { route: '/partners' })

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByText('Partner 1')).toBeInTheDocument()
    expect(screen.getByText('Showing 1–3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Partners' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New partner' })).toHaveAttribute('href', '/partners/new')

    const first = rowOf('Partner 1')
    expect(first.querySelector('img[src="http://localhost/media/partners/one.png"]')).not.toBeNull()
    expect(within(first).getByRole('switch', { name: 'Active: Partner 1' })).toHaveAttribute('aria-checked', 'true')
    expect(within(rowOf('Partner 2')).getByRole('switch', { name: 'Active: Partner 2' })).toHaveAttribute('aria-checked', 'false')
    expect(rowOf('Partner 2').querySelector('img')).toBeNull() // no logo: neutral icon instead
    expect(within(rowOf('Partner 2')).getByText('—')).toBeInTheDocument() // no website
  })

  it('links the website out safely (host only, new tab, noopener) and never links a non-http address', async () => {
    listServer()
    renderWithProviders(<PartnerList />, { route: '/partners' })
    await screen.findByText('Partner 1')

    const link = within(rowOf('Partner 1')).getByRole('link', { name: /www\.one\.example\/about/ })
    expect(link).toHaveAttribute('href', 'https://www.one.example/about/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('dir', 'ltr')
    expect(link).toHaveTextContent('www.one.example/about (opens in a new tab)')

    const legacy = rowOf('Partner 3')
    expect(within(legacy).getByText('javascript:alert(1)')).toBeInTheDocument()
    expect(within(legacy).queryByRole('link', { name: /javascript/ })).not.toBeInTheDocument()
  })

  it('renders in Arabic with Arabic headings and column names', async () => {
    listServer()
    renderWithProviders(<PartnerList />, { route: '/partners', lang: 'ar' })

    expect(await screen.findByText('Partner 1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'الشركاء' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /الشريك/ })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'فعّال: Partner 1' })).toBeInTheDocument()
  })

  it('falls back to the neutral icon when a logo cannot be loaded', async () => {
    listServer()
    renderWithProviders(<PartnerList />, { route: '/partners' })
    await screen.findByText('Partner 1')

    const img = rowOf('Partner 1').querySelector('img')
    fireEvent.error(img)

    await waitFor(() => expect(rowOf('Partner 1').querySelector('img')).toBeNull())
  })

  it('requests the first page ordered by `order` and links each row to its edit page', async () => {
    const server = listServer()
    renderWithProviders(<PartnerList />, { route: '/partners' })
    await screen.findByText('Partner 1')

    expect(lastList(server)).toEqual({ page: '1', per_page: '15', sort: 'order', dir: 'asc' })
    expect(within(rowOf('Partner 2')).getAllByRole('cell')[0]).toHaveTextContent('2')
    expect(within(rowOf('Partner 2')).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/partners/2')
  })

  it('searches (debounced), keeps the term in the URL and resets to page 1', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<PartnerList />, { route: '/partners?page=2' })
    await screen.findByText('Partner 1')

    await user.type(screen.getByRole('searchbox'), 'glob')

    await waitFor(() => expect(lastList(server).search).toBe('glob'))
    expect(lastList(server).page).toBe('1')
    expect(screen.getByTestId('location')).toHaveTextContent('/partners?search=glob')
  })

  it('filters by active / inactive and can reset the filters', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<PartnerList />, { route: '/partners' })
    await screen.findByText('Partner 1')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), '1')

    await waitFor(() => expect(lastList(server).is_active).toBe('1'))
    expect(screen.getByTestId('location')).toHaveTextContent('/partners?is_active=1')

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(lastList(server).is_active).toBeUndefined())
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/partners$/)
  })

  it('sorts by name and status (allowed by the API), never by the website', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<PartnerList />, { route: '/partners' })
    await screen.findByText('Partner 1')

    expect(screen.queryByRole('button', { name: /Website/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Partner$/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'name', dir: 'asc' }))
    await user.click(screen.getByRole('button', { name: /Partner$/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'name', dir: 'desc' }))
    expect(screen.getByRole('columnheader', { name: /Partner$/ })).toHaveAttribute('aria-sort', 'descending')

    await user.click(screen.getByRole('button', { name: /Status/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'is_active', dir: 'asc' }))
  })

  it('paginates', async () => {
    const server = mockApi({ 'GET /partners': ({ query }) => paginated(partners, { page: Number(query.page), perPage: 3, total: 9 }) })
    const { user } = renderWithProviders(<PartnerList />, { route: '/partners' })
    await screen.findByText('Partner 1')
    expect(screen.getByText('Showing 1–3 of 9')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Page 2' }))

    await waitFor(() => expect(lastList(server).page).toBe('2'))
    expect(screen.getByTestId('location')).toHaveTextContent('page=2')
  })

  describe('active toggle', () => {
    it('sends only is_active and shows the saved toast', async () => {
      const server = listServer({ 'PUT /partners/:id': ({ params, body }) => ({ data: { ...makePartner(Number(params.id)), ...body } }) })
      const { user } = renderWithProviders(<PartnerList />, { route: '/partners' })
      await screen.findByText('Partner 1')

      await user.click(screen.getByRole('switch', { name: 'Active: Partner 1' }))

      await waitFor(() => expect(server.calls('PUT', '/partners/1')).toHaveLength(1))
      expect(server.calls('PUT', '/partners/1')[0].body).toEqual({ is_active: false })
      expect(await screen.findByText('Saved')).toBeInTheDocument()
    })

    it('activates an inactive one and reflects the requested value while the request runs', async () => {
      let release
      const gate = new Promise((resolve) => {
        release = resolve
      })
      const server = listServer({
        'PUT /partners/:id': async ({ params, body }) => {
          await gate
          return { data: { ...makePartner(Number(params.id)), ...body } }
        },
      })
      const { user } = renderWithProviders(<PartnerList />, { route: '/partners' })
      await screen.findByText('Partner 2')
      const toggle = screen.getByRole('switch', { name: 'Active: Partner 2' })
      expect(toggle).toHaveAttribute('aria-checked', 'false')

      await user.click(toggle)

      expect(toggle).toHaveAttribute('aria-checked', 'true')
      release()
      await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument())
      expect(server.calls('PUT', '/partners/2')[0].body).toEqual({ is_active: true })
    })

    it('shows an error toast when the update fails', async () => {
      listServer({ 'PUT /partners/:id': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<PartnerList />, { route: '/partners' })
      await screen.findByText('Partner 1')

      await user.click(screen.getByRole('switch', { name: 'Active: Partner 1' }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    })
  })

  describe('delete', () => {
    it('asks first, then deletes and refreshes the list', async () => {
      const server = listServer({ 'DELETE /partners/:id': () => null })
      const { user } = renderWithProviders(<PartnerList />, { route: '/partners' })
      await screen.findByText('Partner 2')

      await user.click(within(rowOf('Partner 2')).getByRole('button', { name: 'Delete' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete partner' })
      expect(dialog).toHaveTextContent('Delete the partner “Partner 2”? This cannot be undone.')
      expect(server.calls('DELETE')).toHaveLength(0)

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(server.calls('DELETE', '/partners/2')).toHaveLength(1))
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/partners').length).toBeGreaterThan(1))
    })

    it('does nothing when the dialog is cancelled', async () => {
      const server = listServer({ 'DELETE /partners/:id': () => null })
      const { user } = renderWithProviders(<PartnerList />, { route: '/partners' })
      await screen.findByText('Partner 2')

      await user.click(within(rowOf('Partner 2')).getByRole('button', { name: 'Delete' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(server.calls('DELETE')).toHaveLength(0)
    })

    it('shows an error toast when the delete fails', async () => {
      listServer({ 'DELETE /partners/:id': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<PartnerList />, { route: '/partners' })
      await screen.findByText('Partner 2')

      await user.click(within(rowOf('Partner 2')).getByRole('button', { name: 'Delete' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    })
  })

  describe('empty and error states', () => {
    it('invites to create the first partner when there are none', async () => {
      mockApi({ 'GET /partners': () => paginated([]) })
      renderWithProviders(<PartnerList />, { route: '/partners' })

      expect(await screen.findByText('No partners yet')).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'New partner' })).toHaveLength(2) // header + empty state
    })

    it('explains an empty search / filter result instead', async () => {
      mockApi({ 'GET /partners': () => paginated([]) })
      renderWithProviders(<PartnerList />, { route: '/partners?search=zzz' })

      expect(await screen.findByText('No results')).toBeInTheDocument()
      expect(screen.queryByText('No partners yet')).not.toBeInTheDocument()
    })

    it('shows a retryable error when the list cannot be loaded', async () => {
      const server = mockApi({ 'GET /partners': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<PartnerList />, { route: '/partners' })

      expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()

      server.on('GET /partners', () => paginated(partners))
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(await screen.findByText('Partner 1')).toBeInTheDocument()
    })
  })

  describe('reorder mode', () => {
    it('loads every row (per_page 200), reorders optimistically and saves the new order', async () => {
      // a stateful fake: the reorder endpoint changes what the next GET returns, like the real API
      let stored = [...partners]
      const server = mockApi({
        'GET /partners': () => paginated(stored),
        'POST /partners/reorder': ({ body }) => {
          stored = body.ids.map((id) => stored.find((row) => row.id === id))
          return null
        },
      })
      const { user } = renderWithProviders(<PartnerList />, { route: '/partners' })
      await screen.findByText('Partner 1')

      await user.click(screen.getByRole('button', { name: 'Reorder' }))

      await waitFor(() => expect(lastList(server)).toEqual({ per_page: '200', sort: 'order', dir: 'asc' }))
      const list = await screen.findByRole('list', { name: 'Partners' })
      expect(within(list).getAllByRole('listitem')).toHaveLength(3)
      expect(within(list).getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(3)
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()

      act(() => dnd.props.onDragEnd({ active: { id: 2 }, over: { id: 1 } })) // drop #2 on #1

      await waitFor(() => expect(server.calls('POST', '/partners/reorder')).toHaveLength(1))
      expect(server.calls('POST', '/partners/reorder')[0].body).toEqual({ ids: [2, 1, 3] })
      const names = within(screen.getByRole('list', { name: 'Partners' })).getAllByRole('listitem').map((item) => within(item).getByText(/Partner \d/).textContent)
      expect(names).toEqual(['Partner 2', 'Partner 1', 'Partner 3'])
      expect(await screen.findByText('Order saved')).toBeInTheDocument()
    })

    it('"Done" returns to the table', async () => {
      listServer()
      const { user } = renderWithProviders(<PartnerList />, { route: '/partners' })
      await screen.findByText('Partner 1')
      await user.click(screen.getByRole('button', { name: 'Reorder' }))
      await screen.findByRole('list', { name: 'Partners' })

      await user.click(screen.getByRole('button', { name: 'Done' }))

      expect(await screen.findByRole('table')).toBeInTheDocument()
    })

    it('is unavailable when there are more rows than one page can hold', async () => {
      mockApi({ 'GET /partners': () => paginated(partners, { perPage: 15, total: 500 }) })
      renderWithProviders(<PartnerList />, { route: '/partners' })
      await screen.findByText('Partner 1')

      expect(screen.getByRole('button', { name: 'Reorder' })).toBeDisabled()
    })
  })
})
