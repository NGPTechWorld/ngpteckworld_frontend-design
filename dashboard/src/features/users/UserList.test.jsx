import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, paginated, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import UserList from './UserList'

const makeUser = (id, name, over = {}) => ({
  id, name, email: `${name.split(' ')[0].toLowerCase()}@ngptechworld.com`, role: 'super_admin', is_super_admin: true, permissions: [],
  created_at: `2026-09-0${id}T10:00:00.000000Z`, ...over,
})
// the signed-in user of renderWithProviders is { id: 1, name: 'Admin', email: 'admin@ngptechworld.com' }
const users = [makeUser(1, 'Admin'), makeUser(2, 'Layla Hassan'), makeUser(3, 'Omar Khaled', { role: 'admin', is_super_admin: false, permissions: ['requests'] })]

const listServer = (extra = {}) => mockApi({ 'GET /users': () => paginated(users), ...extra })
const lastList = (server) => server.calls('GET', '/users').at(-1).query
const rowOf = (name) => within(screen.getByRole('table')).getByText(name, { selector: 'span' }).closest('tr')

describe('UserList', () => {
  it('lists the users with their email and creation date and asks for the first page sorted by name', async () => {
    const server = listServer()
    renderWithProviders(<UserList />, { route: '/users' })

    expect(await screen.findByText('Layla Hassan')).toBeInTheDocument()
    expect(screen.getByText('omar@ngptechworld.com')).toHaveAttribute('dir', 'ltr')
    expect(screen.getByText('Showing 1–3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Users' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New user' })).toHaveAttribute('href', '/users/new')
    expect(lastList(server)).toEqual({ page: '1', per_page: '15', sort: 'name', dir: 'asc' })
    expect(within(rowOf('Layla Hassan')).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/users/2')
  })

  it('shows the role of each user', async () => {
    listServer()
    renderWithProviders(<UserList />, { route: '/users' })
    await screen.findByText('Layla Hassan')

    expect(within(rowOf('Layla Hassan')).getByText('Super admin')).toBeInTheDocument()
    expect(within(rowOf('Omar Khaled')).getByText('Limited admin')).toBeInTheDocument()
  })

  it('marks your own row and gives it no delete button (the API would refuse it)', async () => {
    listServer()
    renderWithProviders(<UserList />, { route: '/users' })
    await screen.findByText('Layla Hassan')

    expect(within(rowOf('Admin')).getByText('You')).toBeInTheDocument()
    expect(within(rowOf('Admin')).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    expect(within(rowOf('Admin')).getByRole('link', { name: 'Edit' })).toBeInTheDocument()
    expect(within(rowOf('Layla Hassan')).getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(within(rowOf('Layla Hassan')).queryByText('You')).not.toBeInTheDocument()
  })

  it('leads to the account page (the top bar "My account" link lands on this list)', async () => {
    listServer()
    renderWithProviders(<UserList />, { route: '/users' })

    expect(await screen.findByText('Your account')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My account' })).toHaveAttribute('href', '/account')
  })

  it('searches (debounced), sorts and paginates through the URL', async () => {
    const server = mockApi({ 'GET /users': ({ query }) => paginated(users, { page: Number(query.page), perPage: 3, total: 9 }) })
    const { user } = renderWithProviders(<UserList />, { route: '/users' })
    await screen.findByText('Layla Hassan')

    await user.type(screen.getByRole('searchbox'), 'layla')
    await waitFor(() => expect(lastList(server).search).toBe('layla'))
    expect(screen.getByTestId('location')).toHaveTextContent('/users?search=layla')

    await user.click(screen.getByRole('button', { name: /^Created/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'created_at', dir: 'asc' }))
    await user.click(screen.getByRole('button', { name: /^Email/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'email', dir: 'asc' }))

    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    await waitFor(() => expect(lastList(server).page).toBe('2'))
  })

  describe('delete', () => {
    it('asks first, then deletes and refreshes the list', async () => {
      const server = listServer({ 'DELETE /users/:id': () => null })
      const { user } = renderWithProviders(<UserList />, { route: '/users' })
      await screen.findByText('Layla Hassan')

      await user.click(within(rowOf('Layla Hassan')).getByRole('button', { name: 'Delete' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete user' })
      expect(dialog).toHaveTextContent('Delete the user “Layla Hassan”? They will no longer be able to sign in to the dashboard.')
      expect(server.calls('DELETE')).toHaveLength(0)
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(server.calls('DELETE', '/users/2')).toHaveLength(1))
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/users').length).toBeGreaterThan(1))
    })

    it('does nothing when the dialog is cancelled', async () => {
      const server = listServer({ 'DELETE /users/:id': () => null })
      const { user } = renderWithProviders(<UserList />, { route: '/users' })
      await screen.findByText('Layla Hassan')

      await user.click(within(rowOf('Layla Hassan')).getByRole('button', { name: 'Delete' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(server.calls('DELETE')).toHaveLength(0)
    })

    it('shows the 422 guard message when the last super admin cannot be deleted', async () => {
      listServer({ 'DELETE /users/:id': () => validationError({ role: ['The last remaining super admin cannot be deleted.'] }) })
      const { user } = renderWithProviders(<UserList />, { route: '/users' })
      await screen.findByText('Layla Hassan')

      await user.click(within(rowOf('Layla Hassan')).getByRole('button', { name: 'Delete' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))

      expect(await screen.findByText('The site cannot be left without at least one super admin.')).toBeInTheDocument()
      expect(screen.queryByText('Deleted')).not.toBeInTheDocument()
      expect(screen.queryByText('Please fix the highlighted fields.')).not.toBeInTheDocument()
      expect(screen.getByText('Layla Hassan')).toBeInTheDocument() // still listed
    })

    it('shows the guard message in Arabic (the API text is English)', async () => {
      listServer({ 'DELETE /users/:id': () => validationError({ role: ['The last remaining super admin cannot be deleted.'] }) })
      const { user } = renderWithProviders(<UserList />, { route: '/users', lang: 'ar' })
      await screen.findByText('Layla Hassan')

      await user.click(within(rowOf('Layla Hassan')).getByRole('button', { name: 'حذف' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'حذف' }))

      expect(await screen.findByText('لا يمكن أن يبقى الموقع بلا مدير عام واحد على الأقل.')).toBeInTheDocument()
    })

    it('shows other server messages as they are, and a generic text for a server error', async () => {
      const server = listServer({ 'DELETE /users/:id': () => reply(422, { message: 'Something else is wrong.' }) })
      const { user } = renderWithProviders(<UserList />, { route: '/users' })
      await screen.findByText('Layla Hassan')

      await user.click(within(rowOf('Layla Hassan')).getByRole('button', { name: 'Delete' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))
      expect(await screen.findByText('Something else is wrong.')).toBeInTheDocument()

      server.on('DELETE /users/:id', () => reply(500, { message: 'boom' }))
      await user.click(within(rowOf('Omar Khaled')).getByRole('button', { name: 'Delete' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))
      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    })
  })

  describe('empty and error states', () => {
    it('invites to add a user when there are none', async () => {
      mockApi({ 'GET /users': () => paginated([]) })
      renderWithProviders(<UserList />, { route: '/users' })

      expect(await screen.findByText('No users')).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'New user' })).toHaveLength(2) // header + empty state
    })

    it('explains an empty search result instead', async () => {
      mockApi({ 'GET /users': () => paginated([]) })
      renderWithProviders(<UserList />, { route: '/users?search=zzz' })

      expect(await screen.findByText('No results')).toBeInTheDocument()
      expect(screen.queryByText('No users')).not.toBeInTheDocument()
    })

    it('shows a retryable error when the list cannot be loaded', async () => {
      const server = mockApi({ 'GET /users': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<UserList />, { route: '/users' })

      expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()

      server.on('GET /users', () => paginated(users))
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(await screen.findByText('Layla Hassan')).toBeInTheDocument()
    })
  })

  it('renders in Arabic', async () => {
    listServer()
    renderWithProviders(<UserList />, { route: '/users', lang: 'ar' })

    expect(await screen.findByText('Layla Hassan')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'المستخدمون' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'حسابي' })).toHaveAttribute('href', '/account')
    expect(within(rowOf('Admin')).getByText('أنت')).toBeInTheDocument()
  })
})
