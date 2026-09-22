import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DASHBOARD_KEY } from '@/features/dashboard/hooks'
import { makeDashboard, makeRequest } from '@/features/dashboard/testData'
import { formatDateTime } from '@/lib/format'
import { mockApi, reply, validationError } from '@/test/mockApi'
import { createTestQueryClient, renderWithProviders } from '@/test/renderWithProviders'
import RequestDetail from './RequestDetail'

const request = makeRequest(7, {
  name: 'Sara Ahmad',
  email: 'sara@example.com',
  phone: '+963 933 000 111',
  message: 'Hello,\nI would like a quote for a mobile app.',
  status: 'new',
  admin_notes: 'Call back on Sunday.',
  created_at: '2026-09-05T10:00:00.000000Z',
  updated_at: '2026-09-06T12:30:00.000000Z',
})
const route = '/requests/7'
const path = '/requests/:id'

function detailServer(extra = {}) {
  return mockApi({
    'GET /requests/:id': () => ({ data: request }),
    'PUT /requests/:id': ({ body }) => ({ data: { ...request, ...body } }),
    'GET /dashboard': () => makeDashboard(),
    ...extra,
  })
}
const notes = () => screen.getByLabelText('Internal notes')
const saveNotes = () => screen.getByRole('button', { name: 'Save notes' })

describe('RequestDetail', () => {
  it('shows a spinner while loading', () => {
    detailServer()
    renderWithProviders(<RequestDetail />, { route, path })
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows every field of the request', async () => {
    detailServer()
    renderWithProviders(<RequestDetail />, { route, path })

    expect(await screen.findByRole('heading', { level: 1, name: 'Sara Ahmad' })).toBeInTheDocument()
    expect(screen.getByText(/I would like a quote for a mobile app\./)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('new')
    expect(notes()).toHaveValue('Call back on Sunday.')
    expect(screen.getByText(formatDateTime(request.created_at, 'en'))).toBeInTheDocument()
    expect(screen.getByText(formatDateTime(request.updated_at, 'en'))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Requests' })).toHaveAttribute('href', '/requests') // back link
  })

  it('links the email (mailto) and the phone (tel) and keeps them left-to-right', async () => {
    detailServer()
    renderWithProviders(<RequestDetail />, { route, path, lang: 'ar' })

    const email = await screen.findByRole('link', { name: 'sara@example.com' })
    expect(email).toHaveAttribute('href', 'mailto:sara@example.com')
    expect(email).toHaveAttribute('dir', 'ltr')
    const phone = screen.getByRole('link', { name: '+963 933 000 111' })
    expect(phone).toHaveAttribute('href', 'tel:+963933000111')
    expect(phone).toHaveAttribute('dir', 'ltr')
    expect(screen.getByRole('link', { name: 'الرد بالبريد' })).toHaveAttribute('href', 'mailto:sara@example.com')
  })

  it('has a "Reply by email" shortcut', async () => {
    detailServer()
    renderWithProviders(<RequestDetail />, { route, path })
    expect(await screen.findByRole('link', { name: 'Reply by email' })).toHaveAttribute('href', 'mailto:sara@example.com')
  })

  it('says so when no phone number was given', async () => {
    detailServer({ 'GET /requests/:id': () => ({ data: { ...request, phone: null } }) })
    renderWithProviders(<RequestDetail />, { route, path })

    expect(await screen.findByText('Not provided')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^tel:/ })).not.toBeInTheDocument()
  })

  describe('status', () => {
    it('is saved immediately (only the status is sent) and the cached dashboard counters go stale', async () => {
      const server = detailServer()
      const queryClient = createTestQueryClient()
      queryClient.setQueryData(DASHBOARD_KEY, makeDashboard().data) // as if the home page had been visited
      const { user } = renderWithProviders(<RequestDetail />, { route, path, queryClient })
      const select = await screen.findByRole('combobox', { name: 'Status' })
      expect(queryClient.getQueryState(DASHBOARD_KEY).isInvalidated).toBe(false)

      await user.selectOptions(select, 'done')

      await waitFor(() => expect(server.calls('PUT', '/requests/7')).toHaveLength(1))
      expect(server.calls('PUT', '/requests/7')[0].body).toEqual({ status: 'done' })
      expect(await screen.findByText('Saved')).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('done')
      await waitFor(() => expect(queryClient.getQueryState(DASHBOARD_KEY).isInvalidated).toBe(true))
    })

    it('does not touch the notes that are being typed', async () => {
      detailServer()
      const { user } = renderWithProviders(<RequestDetail />, { route, path })
      await user.type(await screen.findByLabelText('Internal notes'), ' Sent the quote.')

      await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'in_progress')

      await screen.findByText('Saved')
      expect(notes()).toHaveValue('Call back on Sunday. Sent the quote.')
      expect(saveNotes()).toBeEnabled()
    })

    it('shows an error toast when it cannot be saved', async () => {
      detailServer({ 'PUT /requests/:id': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<RequestDetail />, { route, path })

      await user.selectOptions(await screen.findByRole('combobox', { name: 'Status' }), 'done')

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('new')
    })
  })

  describe('notes', () => {
    it('keeps Save disabled until the text changes', async () => {
      detailServer()
      const { user } = renderWithProviders(<RequestDetail />, { route, path })
      await screen.findByLabelText('Internal notes')
      expect(saveNotes()).toBeDisabled()

      await user.type(notes(), ' More.')
      expect(saveNotes()).toBeEnabled()
    })

    it('saves only the notes, then disables Save again', async () => {
      const server = detailServer()
      const { user } = renderWithProviders(<RequestDetail />, { route, path })
      await user.type(await screen.findByLabelText('Internal notes'), ' Sent the quote.')

      await user.click(saveNotes())

      await waitFor(() => expect(server.calls('PUT', '/requests/7')).toHaveLength(1))
      expect(server.calls('PUT', '/requests/7')[0].body).toEqual({ admin_notes: 'Call back on Sunday. Sent the quote.' })
      expect(await screen.findByText('Saved')).toBeInTheDocument()
      await waitFor(() => expect(saveNotes()).toBeDisabled())
      expect(notes()).toHaveValue('Call back on Sunday. Sent the quote.')
    })

    it('clearing the notes sends null', async () => {
      const server = detailServer()
      const { user } = renderWithProviders(<RequestDetail />, { route, path })
      await user.clear(await screen.findByLabelText('Internal notes'))

      await user.click(saveNotes())

      await waitFor(() => expect(server.calls('PUT', '/requests/7')).toHaveLength(1))
      expect(server.calls('PUT', '/requests/7')[0].body).toEqual({ admin_notes: null })
    })

    it('trims the text before sending', async () => {
      const server = detailServer()
      const { user } = renderWithProviders(<RequestDetail />, { route, path })
      const field = await screen.findByLabelText('Internal notes')
      await user.clear(field)
      await user.type(field, '  spaced  ')

      await user.click(saveNotes())

      await waitFor(() => expect(server.calls('PUT', '/requests/7')).toHaveLength(1))
      expect(server.calls('PUT', '/requests/7')[0].body).toEqual({ admin_notes: 'spaced' })
    })

    it('shows the server validation error under the field and keeps the text', async () => {
      detailServer({ 'PUT /requests/:id': () => validationError({ admin_notes: ['The admin notes field must not be greater than 5000 characters.'] }) })
      const { user } = renderWithProviders(<RequestDetail />, { route, path })
      await user.type(await screen.findByLabelText('Internal notes'), ' x')

      await user.click(saveNotes())

      expect(await screen.findByText('The admin notes field must not be greater than 5000 characters.')).toBeInTheDocument()
      expect(notes()).toHaveAttribute('aria-invalid', 'true')
      expect(notes()).toHaveValue('Call back on Sunday. x')
      expect(saveNotes()).toBeEnabled()
    })

    it('refuses notes longer than 5000 characters without calling the API', async () => {
      const server = detailServer()
      const { user } = renderWithProviders(<RequestDetail />, { route, path })
      await screen.findByLabelText('Internal notes')

      fireEvent.change(notes(), { target: { value: 'x'.repeat(5001) } })
      await user.click(saveNotes())

      expect(await screen.findByText('At most 5000 characters')).toBeInTheDocument()
      expect(server.calls('PUT')).toHaveLength(0)
    })
  })

  describe('delete', () => {
    it('asks first, then deletes and returns to the inbox', async () => {
      const server = detailServer({ 'DELETE /requests/:id': () => null })
      const { user } = renderWithProviders(<RequestDetail />, { route, path })
      await screen.findByRole('heading', { level: 1, name: 'Sara Ahmad' })

      await user.click(screen.getByRole('button', { name: 'Delete' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete request' })
      expect(dialog).toHaveTextContent('Delete the request from “Sara Ahmad”? This cannot be undone.')
      expect(server.calls('DELETE')).toHaveLength(0)
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/requests$/))
      expect(server.calls('DELETE', '/requests/7')).toHaveLength(1)
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
    })

    it('does nothing when the dialog is cancelled', async () => {
      const server = detailServer({ 'DELETE /requests/:id': () => null })
      const { user } = renderWithProviders(<RequestDetail />, { route, path })
      await screen.findByRole('heading', { level: 1, name: 'Sara Ahmad' })

      await user.click(screen.getByRole('button', { name: 'Delete' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(server.calls('DELETE')).toHaveLength(0)
      expect(screen.getByTestId('location')).toHaveTextContent(route)
    })

    it('stays on the page with a toast when the delete fails', async () => {
      detailServer({ 'DELETE /requests/:id': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<RequestDetail />, { route, path })
      await screen.findByRole('heading', { level: 1, name: 'Sara Ahmad' })

      await user.click(screen.getByRole('button', { name: 'Delete' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
      expect(screen.getByTestId('location')).toHaveTextContent(route)
    })
  })

  describe('errors', () => {
    it('shows "not found" for a missing request', async () => {
      detailServer({ 'GET /requests/:id': () => reply(404, { message: 'No query results for model [App\\Models\\Contact] 7' }) })
      renderWithProviders(<RequestDetail />, { route, path })

      expect(await screen.findByText('Request not found')).toBeInTheDocument()
      expect(screen.queryByText(/App\\Models/)).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Requests' })).toHaveAttribute('href', '/requests')
    })

    it('offers a retry when loading fails for another reason', async () => {
      const server = detailServer({ 'GET /requests/:id': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<RequestDetail />, { route, path })

      expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()

      server.on('GET /requests/:id', () => ({ data: request }))
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(await screen.findByRole('heading', { level: 1, name: 'Sara Ahmad' })).toBeInTheDocument()
    })
  })

  it('renders in Arabic', async () => {
    detailServer()
    renderWithProviders(<RequestDetail />, { route, path, lang: 'ar' })

    expect(await screen.findByRole('heading', { level: 1, name: 'Sara Ahmad' })).toBeInTheDocument()
    expect(screen.getByLabelText('ملاحظات داخلية')).toHaveValue('Call back on Sunday.')
    expect(screen.getByRole('button', { name: 'حفظ الملاحظات' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'الحالة' })).toHaveDisplayValue('جديد')
  })
})
