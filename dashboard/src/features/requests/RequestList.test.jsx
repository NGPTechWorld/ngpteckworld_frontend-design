import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeDashboard, makeRequest } from '@/features/dashboard/testData'
import { mockApi, paginated, reply } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import RequestList from './RequestList'

const rows = [
  makeRequest(1, { name: 'Sara Ahmad', status: 'new' }),
  makeRequest(2, { name: 'Omar Khaled', status: 'in_progress' }),
  makeRequest(3, { name: 'Layla Hassan', status: 'done' }),
]

function listServer(extra = {}) {
  return mockApi({
    'GET /requests': () => paginated(rows),
    'GET /dashboard': () => makeDashboard(),
    ...extra,
  })
}
const lastList = (server) => server.calls('GET', '/requests').at(-1).query
const checkboxes = () => screen.getAllByRole('checkbox', { name: 'Select row' })
const bulkBar = () => screen.getByRole('region', { name: 'Actions for the selected requests' })

describe('RequestList', () => {
  it('shows a skeleton first, then the requests, ordered by date (newest first) by default', async () => {
    const server = listServer()
    renderWithProviders(<RequestList />, { route: '/requests' })

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    expect(screen.getByText('client2@example.com')).toBeInTheDocument()
    expect(screen.getByText('Showing 1–3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Requests' })).toBeInTheDocument()
    expect(lastList(server)).toEqual({ page: '1', per_page: '15', sort: 'created_at', dir: 'desc' })
    expect(screen.getByRole('columnheader', { name: /Received/ })).toHaveAttribute('aria-sort', 'descending')
  })

  describe('status tabs', () => {
    it('show the counts of the dashboard endpoint', async () => {
      listServer()
      renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')

      await waitFor(() => expect(screen.getByRole('tab', { name: /^All/ })).toHaveTextContent('48'))
      expect(screen.getByRole('tab', { name: /^New/ })).toHaveTextContent('4')
      expect(screen.getByRole('tab', { name: /^In progress/ })).toHaveTextContent('3')
      expect(screen.getByRole('tab', { name: /^Done/ })).toHaveTextContent('41')
      expect(screen.getByRole('tab', { name: /^All/ })).toHaveAttribute('aria-selected', 'true')
    })

    it('filter by status through the URL', async () => {
      const server = listServer()
      const { user } = renderWithProviders(<RequestList />, { route: '/requests?page=2' })
      await screen.findByText('Sara Ahmad')

      await user.click(screen.getByRole('tab', { name: /^In progress/ }))

      await waitFor(() => expect(lastList(server).status).toBe('in_progress'))
      expect(lastList(server).page).toBe('1')
      expect(screen.getByTestId('location')).toHaveTextContent('/requests?status=in_progress')
      expect(screen.getByRole('tab', { name: /^In progress/ })).toHaveAttribute('aria-selected', 'true')

      await user.click(screen.getByRole('tab', { name: /^All/ }))
      await waitFor(() => expect(lastList(server).status).toBeUndefined())
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/requests$/)
    })

    it('are preselected by a link such as the dashboard card "New requests"', async () => {
      const server = listServer()
      renderWithProviders(<RequestList />, { route: '/requests?status=new' })
      await screen.findByText('Sara Ahmad')

      expect(lastList(server).status).toBe('new')
      expect(screen.getByRole('tab', { name: /^New/ })).toHaveAttribute('aria-selected', 'true')
    })

    it('treat an unknown status in the URL as "All"', async () => {
      const server = listServer()
      renderWithProviders(<RequestList />, { route: '/requests?status=bogus' })
      await screen.findByText('Sara Ahmad')

      expect(lastList(server).status).toBeUndefined()
      expect(screen.getByRole('tab', { name: /^All/ })).toHaveAttribute('aria-selected', 'true')
    })

    it('still work when the counts cannot be loaded', async () => {
      listServer({ 'GET /dashboard': () => reply(500, { message: 'boom' }) })
      renderWithProviders(<RequestList />, { route: '/requests' })

      expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument()
    })
  })

  describe('filters, sorting and paging', () => {
    it('searches (debounced) and keeps the term in the URL', async () => {
      const server = listServer()
      const { user } = renderWithProviders(<RequestList />, { route: '/requests?page=2' })
      await screen.findByText('Sara Ahmad')

      await user.type(screen.getByRole('searchbox'), 'sara')

      await waitFor(() => expect(lastList(server).search).toBe('sara'))
      expect(lastList(server).page).toBe('1')
      expect(screen.getByTestId('location')).toHaveTextContent('/requests?search=sara')
    })

    it('filters by a from / to date range and can reset everything', async () => {
      const server = listServer()
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')

      fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-01' } })
      await waitFor(() => expect(lastList(server).from).toBe('2026-09-01'))
      fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-20' } })
      await waitFor(() => expect(lastList(server)).toMatchObject({ from: '2026-09-01', to: '2026-09-20' }))
      expect(screen.getByTestId('location')).toHaveTextContent('/requests?from=2026-09-01&to=2026-09-20')
      expect(screen.getByLabelText('From')).toHaveAttribute('max', '2026-09-20')
      expect(screen.getByLabelText('To')).toHaveAttribute('min', '2026-09-01')

      await user.click(screen.getByRole('button', { name: 'Reset' }))

      await waitFor(() => expect(lastList(server).from).toBeUndefined())
      expect(lastList(server).to).toBeUndefined()
      expect(screen.getByLabelText('From')).toHaveValue('')
    })

    it('sorts by the columns the API allows', async () => {
      const server = listServer()
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')

      await user.click(screen.getByRole('button', { name: /^Name/ }))
      await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'name', dir: 'asc' }))
      expect(screen.getByRole('columnheader', { name: /^Name/ })).toHaveAttribute('aria-sort', 'ascending')

      await user.click(screen.getByRole('button', { name: /^Name/ }))
      await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'name', dir: 'desc' }))

      await user.click(screen.getByRole('button', { name: /^Status/ }))
      await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'status', dir: 'asc' }))

      await user.click(screen.getByRole('button', { name: /^Email/ }))
      await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'email', dir: 'asc' }))

      await user.click(screen.getByRole('button', { name: /^Received/ }))
      await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'created_at', dir: 'asc' }))
      // the title is only a preview under the name: there is no column (and no server sort) for it
      expect(screen.queryByRole('columnheader', { name: /^Title/ })).not.toBeInTheDocument()
      expect(within(screen.getByText('Sara Ahmad').closest('tr')).getByText(rows[0].title)).toBeInTheDocument()
    })

    it('paginates', async () => {
      const server = mockApi({
        'GET /requests': ({ query }) => paginated(rows, { page: Number(query.page), perPage: 3, total: 9 }),
        'GET /dashboard': () => makeDashboard(),
      })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')
      expect(screen.getByText('Showing 1–3 of 9')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Page 2' }))

      await waitFor(() => expect(lastList(server).page).toBe('2'))
      expect(screen.getByTestId('location')).toHaveTextContent('page=2')
    })
  })

  describe('opening a request', () => {
    it('clicking a row opens its detail page', async () => {
      listServer()
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')

      await user.click(screen.getByText('client2@example.com'))

      expect(screen.getByTestId('location')).toHaveTextContent(/^\/requests\/2$/)
    })

    it('the name is a real link and the row has a "View request" action', async () => {
      listServer()
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')

      expect(screen.getByRole('link', { name: 'Omar Khaled' })).toHaveAttribute('href', '/requests/2')
      expect(within(screen.getByText('Layla Hassan').closest('tr')).getByRole('link', { name: 'View request' })).toHaveAttribute('href', '/requests/3')

      await user.click(screen.getByRole('link', { name: 'Sara Ahmad' }))
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/requests\/1$/)
    })
  })

  describe('inline status', () => {
    it('sends only the new status, toasts, and refreshes the counters', async () => {
      const server = listServer({ 'PUT /requests/:id': ({ params, body }) => ({ data: { ...rows[Number(params.id) - 1], ...body } }) })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')
      const before = server.calls('GET', '/dashboard').length

      const select = screen.getByRole('combobox', { name: 'Status of Sara Ahmad' })
      expect(select).toHaveValue('new')
      await user.selectOptions(select, 'done')

      await waitFor(() => expect(server.calls('PUT', '/requests/1')).toHaveLength(1))
      expect(server.calls('PUT', '/requests/1')[0].body).toEqual({ status: 'done' })
      expect(await screen.findByText('Saved')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/dashboard').length).toBeGreaterThan(before))
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/requests$/) // the select did not open the row
    })

    it('shows the requested value while the request runs', async () => {
      let release
      const gate = new Promise((resolve) => {
        release = resolve
      })
      listServer({
        'PUT /requests/:id': async ({ params, body }) => {
          await gate
          return { data: { ...rows[Number(params.id) - 1], ...body } }
        },
      })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')
      const select = screen.getByRole('combobox', { name: 'Status of Sara Ahmad' })

      await user.selectOptions(select, 'in_progress')

      expect(select).toHaveValue('in_progress')
      release()
      expect(await screen.findByText('Saved')).toBeInTheDocument()
    })

    it('shows an error toast when the update fails', async () => {
      listServer({ 'PUT /requests/:id': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')

      await user.selectOptions(screen.getByRole('combobox', { name: 'Status of Sara Ahmad' }), 'done')

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    })
  })

  describe('bulk actions', () => {
    it('selecting rows shows the bulk bar; "Mark as in progress" sends the ids and clears the selection', async () => {
      const server = listServer({ 'POST /requests/bulk': () => null })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')
      expect(screen.queryByRole('region', { name: 'Actions for the selected requests' })).not.toBeInTheDocument()

      await user.click(checkboxes()[0])
      await user.click(checkboxes()[1])

      expect(within(bulkBar()).getByText('2 selected')).toBeInTheDocument()
      const before = server.calls('GET', '/requests').length
      await user.click(within(bulkBar()).getByRole('button', { name: 'Mark as in progress' }))

      await waitFor(() => expect(server.calls('POST', '/requests/bulk')).toHaveLength(1))
      expect(server.calls('POST', '/requests/bulk')[0].body).toEqual({ action: 'status', ids: [1, 2], status: 'in_progress' })
      expect(await screen.findByText('Saved')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/requests').length).toBeGreaterThan(before))
      await waitFor(() => expect(screen.queryByRole('region', { name: 'Actions for the selected requests' })).not.toBeInTheDocument())
    })

    it('offers all three statuses', async () => {
      const server = listServer({ 'POST /requests/bulk': () => null })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')

      await user.click(checkboxes()[2])
      await user.click(within(bulkBar()).getByRole('button', { name: 'Mark as new' }))
      await waitFor(() => expect(server.calls('POST', '/requests/bulk')).toHaveLength(1))
      expect(server.calls('POST', '/requests/bulk')[0].body).toEqual({ action: 'status', ids: [3], status: 'new' })

      await waitFor(() => expect(screen.queryByRole('region', { name: 'Actions for the selected requests' })).not.toBeInTheDocument())
      await user.click(checkboxes()[2])
      await user.click(within(bulkBar()).getByRole('button', { name: 'Mark as done' }))
      await waitFor(() => expect(server.calls('POST', '/requests/bulk')).toHaveLength(2))
      expect(server.calls('POST', '/requests/bulk')[1].body).toEqual({ action: 'status', ids: [3], status: 'done' })
    })

    it('"Select all" selects every row on screen', async () => {
      listServer()
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')

      await user.click(screen.getByRole('checkbox', { name: 'Select all' }))

      expect(within(bulkBar()).getByText('3 selected')).toBeInTheDocument()
      await user.click(within(bulkBar()).getByRole('button', { name: 'Clear selection' }))
      expect(screen.queryByRole('region', { name: 'Actions for the selected requests' })).not.toBeInTheDocument()
    })

    it('bulk delete asks first, then sends the ids', async () => {
      const server = listServer({ 'POST /requests/bulk': () => null })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')
      await user.click(checkboxes()[0])
      await user.click(checkboxes()[2])

      await user.click(within(bulkBar()).getByRole('button', { name: 'Delete' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete selected requests' })
      expect(dialog).toHaveTextContent('2 requests will be permanently deleted.')
      expect(server.calls('POST', '/requests/bulk')).toHaveLength(0)

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(server.calls('POST', '/requests/bulk')).toHaveLength(1))
      expect(server.calls('POST', '/requests/bulk')[0].body).toEqual({ action: 'delete', ids: [1, 3] })
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
    })

    it('does not delete when the dialog is cancelled', async () => {
      const server = listServer({ 'POST /requests/bulk': () => null })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')
      await user.click(checkboxes()[0])

      await user.click(within(bulkBar()).getByRole('button', { name: 'Delete' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(server.calls('POST', '/requests/bulk')).toHaveLength(0)
      expect(bulkBar()).toBeInTheDocument() // the selection is kept
    })

    it('a selection does not survive a change of filter', async () => {
      listServer()
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')
      await user.click(checkboxes()[0])
      expect(bulkBar()).toBeInTheDocument()

      await user.click(screen.getByRole('tab', { name: /^Done/ }))

      await waitFor(() => expect(screen.queryByRole('region', { name: 'Actions for the selected requests' })).not.toBeInTheDocument())
    })

    it('shows an error toast when the bulk request fails and keeps the selection', async () => {
      listServer({ 'POST /requests/bulk': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')
      await user.click(checkboxes()[0])

      await user.click(within(bulkBar()).getByRole('button', { name: 'Mark as done' }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
      expect(bulkBar()).toBeInTheDocument()
    })
  })

  describe('deleting one request', () => {
    it('asks first, then deletes and refreshes the counters', async () => {
      const server = listServer({ 'DELETE /requests/:id': () => null })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Omar Khaled')
      const before = server.calls('GET', '/dashboard').length

      await user.click(within(screen.getByText('Omar Khaled').closest('tr')).getByRole('button', { name: 'Delete' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete request' })
      expect(dialog).toHaveTextContent('Delete the request from “Omar Khaled”? This cannot be undone.')
      expect(server.calls('DELETE')).toHaveLength(0)
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(server.calls('DELETE', '/requests/2')).toHaveLength(1))
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/dashboard').length).toBeGreaterThan(before))
    })

    it('does nothing when cancelled', async () => {
      const server = listServer({ 'DELETE /requests/:id': () => null })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Omar Khaled')

      await user.click(within(screen.getByText('Omar Khaled').closest('tr')).getByRole('button', { name: 'Delete' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(server.calls('DELETE')).toHaveLength(0)
    })
  })

  describe('CSV export', () => {
    const csvReply = () => reply(200, 'id,name', { 'Content-Type': 'text/csv; charset=UTF-8', 'Content-Disposition': 'attachment; filename="requests-20260921.csv"' })

    it('downloads what the list shows: every active filter and the sort, but no page', async () => {
      const downloads = []
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
        downloads.push(this.download)
      })
      const server = listServer({ 'GET /requests/export': csvReply })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests?status=new&search=sara&from=2026-09-01&to=2026-09-20&sort=name&dir=asc&page=2&per_page=30' })
      await screen.findByText('Sara Ahmad')

      await user.click(screen.getByRole('button', { name: 'Export CSV' }))

      await waitFor(() => expect(server.calls('GET', '/requests/export')).toHaveLength(1))
      expect(server.calls('GET', '/requests/export')[0].query).toEqual({ status: 'new', search: 'sara', from: '2026-09-01', to: '2026-09-20', sort: 'name', dir: 'asc' })
      await waitFor(() => expect(downloads).toEqual(['requests-20260921.csv']))
      expect(await screen.findByText('The requests file was downloaded')).toBeInTheDocument()
    })

    it('exports everything (default sort) when no filter is set', async () => {
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      const server = listServer({ 'GET /requests/export': csvReply })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')

      await user.click(screen.getByRole('button', { name: 'Export CSV' }))

      await waitFor(() => expect(server.calls('GET', '/requests/export')).toHaveLength(1))
      expect(server.calls('GET', '/requests/export')[0].query).toEqual({ sort: 'created_at', dir: 'desc' })
    })

    it('shows a loading state while the file is prepared', async () => {
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      let release
      const gate = new Promise((resolve) => {
        release = resolve
      })
      listServer({
        'GET /requests/export': async () => {
          await gate
          return csvReply()
        },
      })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')

      await user.click(screen.getByRole('button', { name: 'Export CSV' }))

      expect(await screen.findByRole('button', { name: 'Exporting…' })).toBeDisabled()
      release()
      expect(await screen.findByRole('button', { name: 'Export CSV' })).toBeEnabled()
    })

    it('shows an error and downloads nothing when the export fails', async () => {
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      listServer({ 'GET /requests/export': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })
      await screen.findByText('Sara Ahmad')

      await user.click(screen.getByRole('button', { name: 'Export CSV' }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
      expect(click).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled()
    })

    it('is disabled when there is nothing to export', async () => {
      mockApi({ 'GET /requests': () => paginated([]), 'GET /dashboard': () => makeDashboard() })
      renderWithProviders(<RequestList />, { route: '/requests' })

      expect(await screen.findByText('No requests yet')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled()
    })
  })

  describe('empty and error states', () => {
    it('explains that no request has arrived yet (and offers no "new" button: requests come from the site)', async () => {
      mockApi({ 'GET /requests': () => paginated([]), 'GET /dashboard': () => makeDashboard() })
      renderWithProviders(<RequestList />, { route: '/requests' })

      expect(await screen.findByText('No requests yet')).toBeInTheDocument()
      expect(screen.getByText(/contact form will show up here/)).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /new/i })).not.toBeInTheDocument()
    })

    it('explains an empty result of a filter instead', async () => {
      mockApi({ 'GET /requests': () => paginated([]), 'GET /dashboard': () => makeDashboard() })
      renderWithProviders(<RequestList />, { route: '/requests?search=zzz' })

      expect(await screen.findByText('No results')).toBeInTheDocument()
      expect(screen.queryByText('No requests yet')).not.toBeInTheDocument()
    })

    it('an empty status tab is a "no results" too', async () => {
      mockApi({ 'GET /requests': () => paginated([]), 'GET /dashboard': () => makeDashboard() })
      renderWithProviders(<RequestList />, { route: '/requests?status=done' })

      expect(await screen.findByText('No results')).toBeInTheDocument()
    })

    it('shows a retryable error when the list cannot be loaded', async () => {
      const server = mockApi({ 'GET /requests': () => reply(500, { message: 'boom' }), 'GET /dashboard': () => makeDashboard() })
      const { user } = renderWithProviders(<RequestList />, { route: '/requests' })

      expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()

      server.on('GET /requests', () => paginated(rows))
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    })
  })

  it('renders in Arabic with Arabic labels', async () => {
    listServer()
    renderWithProviders(<RequestList />, { route: '/requests', lang: 'ar' })

    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'الطلبات' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^الكل/ })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'حالة طلب Sara Ahmad' })).toHaveDisplayValue('جديد')
    expect(screen.getByRole('button', { name: 'تصدير CSV' })).toBeInTheDocument()
    expect(screen.getByLabelText('من تاريخ')).toBeInTheDocument()
  })
})
