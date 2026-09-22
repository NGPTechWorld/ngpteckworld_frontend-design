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

const { default: FaqList } = await import('./FaqList')

const makeFaq = (id, over = {}) => ({
  id,
  question_ar: `سؤال ${id}`,
  question_en: `Question ${id}?`,
  answer_ar: `جواب ${id}`,
  answer_en: `Answer ${id}`,
  is_active: true,
  order: id - 1,
  created_at: '2026-09-01T10:00:00.000000Z',
  updated_at: '2026-09-01T10:00:00.000000Z',
  ...over,
})
const faqs = [makeFaq(1), makeFaq(2, { is_active: false }), makeFaq(3)]

function listServer(extra = {}) {
  return mockApi({ 'GET /faqs': () => paginated(faqs, { perPage: 15 }), ...extra })
}
const lastList = (server) => server.calls('GET', '/faqs').at(-1).query

describe('FaqList', () => {
  it('shows a skeleton first, then the questions with both languages and the pagination summary', async () => {
    listServer()
    renderWithProviders(<FaqList />, { route: '/faqs' })

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByText('Question 1?')).toBeInTheDocument()
    expect(screen.getByText('سؤال 1')).toBeInTheDocument() // the other language, smaller
    expect(screen.getByText('Showing 1–3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'FAQ' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New question' })).toHaveAttribute('href', '/faqs/new')
  })

  it('shows the Arabic question first in the Arabic UI', async () => {
    listServer()
    renderWithProviders(<FaqList />, { route: '/faqs', lang: 'ar' })
    expect(await screen.findByText('سؤال 1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'الأسئلة الشائعة' })).toBeInTheDocument()
    expect(screen.getByText('Question 1?')).toHaveAttribute('dir', 'ltr')
  })

  it('requests the first page ordered by `order` and links each row to its edit page', async () => {
    const server = listServer()
    renderWithProviders(<FaqList />, { route: '/faqs' })
    await screen.findByText('Question 1?')

    expect(lastList(server)).toEqual({ page: '1', per_page: '15', sort: 'order', dir: 'asc' })
    const row = screen.getByText('Question 2?').closest('tr')
    expect(within(row).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/faqs/2')
  })

  it('searches (debounced), keeps the term in the URL and resets to page 1', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<FaqList />, { route: '/faqs?page=2' })
    await screen.findByText('Question 1?')

    await user.type(screen.getByRole('searchbox'), 'payment')

    await waitFor(() => expect(lastList(server).search).toBe('payment'))
    expect(lastList(server).page).toBe('1')
    expect(screen.getByTestId('location')).toHaveTextContent('/faqs?search=payment')
  })

  it('filters by active / inactive and can reset the filters', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<FaqList />, { route: '/faqs' })
    await screen.findByText('Question 1?')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), '0')

    await waitFor(() => expect(lastList(server).is_active).toBe('0'))
    expect(screen.getByTestId('location')).toHaveTextContent('/faqs?is_active=0')

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(lastList(server).is_active).toBeUndefined())
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/faqs$/)
  })

  it('sorts by creation date from the column header', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<FaqList />, { route: '/faqs' })
    await screen.findByText('Question 1?')

    await user.click(screen.getByRole('button', { name: /Created/ }))

    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'created_at', dir: 'asc' }))
    expect(screen.getByRole('columnheader', { name: /Created/ })).toHaveAttribute('aria-sort', 'ascending')
  })

  it('paginates', async () => {
    const server = mockApi({ 'GET /faqs': ({ query }) => paginated(faqs, { page: Number(query.page), perPage: 3, total: 9 }) })
    const { user } = renderWithProviders(<FaqList />, { route: '/faqs' })
    await screen.findByText('Question 1?')
    expect(screen.getByText('Showing 1–3 of 9')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Page 2' }))

    await waitFor(() => expect(lastList(server).page).toBe('2'))
    expect(screen.getByTestId('location')).toHaveTextContent('page=2')
  })

  describe('active toggle', () => {
    it('sends only is_active and shows the saved toast', async () => {
      const server = listServer({ 'PUT /faqs/:id': ({ params, body }) => ({ data: { ...makeFaq(Number(params.id)), ...body } }) })
      const { user } = renderWithProviders(<FaqList />, { route: '/faqs' })
      await screen.findByText('Question 1?')

      await user.click(screen.getByRole('switch', { name: /Active: Question 1\?/ }))

      await waitFor(() => expect(server.calls('PUT', '/faqs/1')).toHaveLength(1))
      expect(server.calls('PUT', '/faqs/1')[0].body).toEqual({ is_active: false })
      expect(await screen.findByText('Saved')).toBeInTheDocument()
    })

    it('reflects the requested value immediately while the request runs', async () => {
      let release
      const gate = new Promise((resolve) => {
        release = resolve
      })
      listServer({
        'PUT /faqs/:id': async ({ params, body }) => {
          await gate
          return { data: { ...makeFaq(Number(params.id)), ...body } }
        },
      })
      const { user } = renderWithProviders(<FaqList />, { route: '/faqs' })
      await screen.findByText('Question 2?')
      const toggle = screen.getByRole('switch', { name: /Active: Question 2\?/ })
      expect(toggle).toHaveAttribute('aria-checked', 'false')

      await user.click(toggle)

      expect(toggle).toHaveAttribute('aria-checked', 'true')
      release()
      await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument())
    })

    it('shows an error toast when the update fails', async () => {
      listServer({ 'PUT /faqs/:id': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<FaqList />, { route: '/faqs' })
      await screen.findByText('Question 1?')

      await user.click(screen.getByRole('switch', { name: /Active: Question 1\?/ }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    })
  })

  describe('delete', () => {
    it('asks first, then deletes and refreshes the list', async () => {
      const server = listServer({ 'DELETE /faqs/:id': () => null })
      const { user } = renderWithProviders(<FaqList />, { route: '/faqs' })
      await screen.findByText('Question 2?')

      await user.click(within(screen.getByText('Question 2?').closest('tr')).getByRole('button', { name: 'Delete' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete question' })
      expect(dialog).toHaveTextContent('Delete the question “Question 2?”? This cannot be undone.')
      expect(server.calls('DELETE')).toHaveLength(0)

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(server.calls('DELETE', '/faqs/2')).toHaveLength(1))
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/faqs').length).toBeGreaterThan(1))
    })

    it('does nothing when the dialog is cancelled', async () => {
      const server = listServer({ 'DELETE /faqs/:id': () => null })
      const { user } = renderWithProviders(<FaqList />, { route: '/faqs' })
      await screen.findByText('Question 2?')

      await user.click(within(screen.getByText('Question 2?').closest('tr')).getByRole('button', { name: 'Delete' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(server.calls('DELETE')).toHaveLength(0)
    })
  })

  describe('empty and error states', () => {
    it('invites to create the first question when there are none', async () => {
      mockApi({ 'GET /faqs': () => paginated([]) })
      renderWithProviders(<FaqList />, { route: '/faqs' })

      expect(await screen.findByText('No questions yet')).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'New question' })).toHaveLength(2) // header + empty state
    })

    it('explains an empty search result instead', async () => {
      mockApi({ 'GET /faqs': () => paginated([]) })
      renderWithProviders(<FaqList />, { route: '/faqs?search=zzz' })

      expect(await screen.findByText('No results')).toBeInTheDocument()
      expect(screen.queryByText('No questions yet')).not.toBeInTheDocument()
    })

    it('shows a retryable error when the list cannot be loaded', async () => {
      const server = mockApi({ 'GET /faqs': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<FaqList />, { route: '/faqs' })

      expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()

      server.on('GET /faqs', () => paginated(faqs))
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(await screen.findByText('Question 1?')).toBeInTheDocument()
    })
  })

  describe('reorder mode', () => {
    it('loads every row (per_page 200), reorders optimistically and saves the new order', async () => {
      // a stateful fake: the reorder endpoint changes what the next GET returns, like the real API
      let stored = [...faqs]
      const server = mockApi({
        'GET /faqs': () => paginated(stored),
        'POST /faqs/reorder': ({ body }) => {
          stored = body.ids.map((id) => stored.find((row) => row.id === id))
          return null
        },
      })
      const { user } = renderWithProviders(<FaqList />, { route: '/faqs' })
      await screen.findByText('Question 1?')

      await user.click(screen.getByRole('button', { name: 'Reorder' }))

      await waitFor(() => expect(lastList(server)).toEqual({ per_page: '200', sort: 'order', dir: 'asc' }))
      const list = await screen.findByRole('list', { name: 'FAQ' })
      expect(within(list).getAllByRole('listitem').map((item) => item.textContent.replace(/\D*(\d)\D*/, '$1|'))).toHaveLength(3)
      expect(within(list).getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(3)
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()

      act(() => dnd.props.onDragEnd({ active: { id: 1 }, over: { id: 3 } })) // drop #1 on #3

      await waitFor(() => expect(server.calls('POST', '/faqs/reorder')).toHaveLength(1))
      expect(server.calls('POST', '/faqs/reorder')[0].body).toEqual({ ids: [2, 3, 1] })
      const titles = within(screen.getByRole('list', { name: 'FAQ' })).getAllByRole('listitem').map((item) => within(item).getByText(/Question \d\?/).textContent)
      expect(titles).toEqual(['Question 2?', 'Question 3?', 'Question 1?'])
      expect(await screen.findByText('Order saved')).toBeInTheDocument()
    })

    it('"Done" returns to the table', async () => {
      listServer()
      const { user } = renderWithProviders(<FaqList />, { route: '/faqs' })
      await screen.findByText('Question 1?')
      await user.click(screen.getByRole('button', { name: 'Reorder' }))
      await screen.findByRole('list', { name: 'FAQ' })

      await user.click(screen.getByRole('button', { name: 'Done' }))

      expect(await screen.findByRole('table')).toBeInTheDocument()
    })

    it('is unavailable when there are more rows than one page can hold', async () => {
      mockApi({ 'GET /faqs': () => paginated(faqs, { perPage: 15, total: 500 }) })
      renderWithProviders(<FaqList />, { route: '/faqs' })
      await screen.findByText('Question 1?')

      expect(screen.getByRole('button', { name: 'Reorder' })).toBeDisabled()
    })
  })
})
