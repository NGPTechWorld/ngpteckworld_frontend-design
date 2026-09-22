import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockApi, paginated, reply } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import './testTimeouts'
import { makeProject } from './testUtils'

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

const { default: ProjectList } = await import('./ProjectList')

const projects = [
  makeProject(1, { category: 'web', year: 2023, featured: true, team_members_count: 3, links_count: 2, cover_image_url: 'http://localhost/media/projects/one.jpg' }),
  makeProject(2, { category: 'mobile', year: 2025, status: 'in_progress' }),
  makeProject(3, { category: 'erp', year: 2021 }),
]

function listServer(extra = {}) {
  return mockApi({ 'GET /projects': () => paginated(projects, { perPage: 15 }), ...extra })
}
const lastList = (server) => server.calls('GET', '/projects').at(-1).query
const rowOf = (name) => screen.getByText(name).closest('tr')

describe('ProjectList', () => {
  it('shows a skeleton first, then a row per project with both names, badges, counts and the pagination summary', async () => {
    listServer()
    renderWithProviders(<ProjectList />, { route: '/projects' })

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByText('Project 1')).toBeInTheDocument()
    expect(screen.getByText('مشروع 1')).toBeInTheDocument() // the other language, smaller
    expect(screen.getByText('Showing 1–3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New project' })).toHaveAttribute('href', '/projects/new')

    const first = within(rowOf('Project 1'))
    expect(first.getByText('Web')).toBeInTheDocument() // category badge
    expect(first.getByText('2023')).toBeInTheDocument()
    expect(first.getByText('Completed')).toBeInTheDocument()
    expect(first.getByTitle('3 team members')).toHaveTextContent('3')
    expect(first.getByTitle('2 links')).toHaveTextContent('2')
    expect(first.getByRole('switch', { name: 'Featured: Project 1' })).toHaveAttribute('aria-checked', 'true')
    expect(rowOf('Project 1').querySelector('img')).toHaveAttribute('src', 'http://localhost/media/projects/one.jpg')

    const second = within(rowOf('Project 2'))
    expect(second.getByText('Mobile')).toBeInTheDocument()
    expect(second.getByText('In progress')).toBeInTheDocument()
    expect(second.getByRole('switch', { name: 'Featured: Project 2' })).toHaveAttribute('aria-checked', 'false')
  })

  it('shows the Arabic name first in the Arabic UI', async () => {
    listServer()
    renderWithProviders(<ProjectList />, { route: '/projects', lang: 'ar' })

    expect(await screen.findByText('مشروع 1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'المشاريع' })).toBeInTheDocument()
    expect(screen.getByText('Project 1')).toHaveAttribute('dir', 'ltr')
    expect(within(rowOf('مشروع 2')).getByText('قيد التنفيذ')).toBeInTheDocument()
    expect(within(rowOf('مشروع 2')).getByText('تطبيقات موبايل')).toBeInTheDocument()
  })

  it('requests the first page ordered by `order` and links each row to its edit page', async () => {
    const server = listServer()
    renderWithProviders(<ProjectList />, { route: '/projects' })
    await screen.findByText('Project 1')

    expect(lastList(server)).toEqual({ page: '1', per_page: '15', sort: 'order', dir: 'asc' })
    expect(within(rowOf('Project 2')).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/projects/2')
  })

  it('searches (debounced), keeps the term in the URL and resets to page 1', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<ProjectList />, { route: '/projects?page=2' })
    await screen.findByText('Project 1')

    await user.type(screen.getByRole('searchbox'), 'falcon')

    await waitFor(() => expect(lastList(server).search).toBe('falcon'))
    expect(lastList(server).page).toBe('1')
    expect(screen.getByTestId('location')).toHaveTextContent('/projects?search=falcon')
  })

  it('filters by category, status and featured, and can reset the filters', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<ProjectList />, { route: '/projects' })
    await screen.findByText('Project 1')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'mobile')
    await waitFor(() => expect(lastList(server).category).toBe('mobile'))

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'in_progress')
    await waitFor(() => expect(lastList(server).status).toBe('in_progress'))

    await user.selectOptions(screen.getByRole('combobox', { name: 'Featured' }), '1')
    await waitFor(() => expect(lastList(server).featured).toBe('1'))
    expect(lastList(server)).toMatchObject({ category: 'mobile', status: 'in_progress', featured: '1' })
    expect(screen.getByTestId('location')).toHaveTextContent('category=mobile')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Featured' }), '0')
    await waitFor(() => expect(lastList(server).featured).toBe('0'))

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(lastList(server).category).toBeUndefined())
    expect(lastList(server).status).toBeUndefined()
    expect(lastList(server).featured).toBeUndefined()
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/projects$/)
  })

  it('sorts by the columns the API can sort by and toggles the direction', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<ProjectList />, { route: '/projects' })
    await screen.findByText('Project 1')

    await user.click(screen.getByRole('button', { name: /Year/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'year', dir: 'asc' }))
    expect(screen.getByRole('columnheader', { name: /Year/ })).toHaveAttribute('aria-sort', 'ascending')

    await user.click(screen.getByRole('button', { name: /Year/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'year', dir: 'desc' }))

    await user.click(screen.getByRole('button', { name: /Category/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'category', dir: 'asc' }))

    await user.click(screen.getByRole('button', { name: /Project/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'name_en', dir: 'asc' })) // the name of the UI language

    await user.click(screen.getByRole('button', { name: /Featured/ }))
    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'featured', dir: 'asc' }))
  })

  it('sorts by the Arabic name in the Arabic UI', async () => {
    const server = listServer()
    const { user } = renderWithProviders(<ProjectList />, { route: '/projects', lang: 'ar' })
    await screen.findByText('مشروع 1')

    await user.click(screen.getByRole('button', { name: /المشروع/ }))

    await waitFor(() => expect(lastList(server)).toMatchObject({ sort: 'name_ar', dir: 'asc' }))
  })

  it('does not offer sorting on the counts (the API cannot sort by them)', async () => {
    listServer()
    renderWithProviders(<ProjectList />, { route: '/projects' })
    await screen.findByText('Project 1')

    expect(screen.queryByRole('button', { name: /Team/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Links/ })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Team' })).not.toHaveAttribute('aria-sort')
  })

  it('paginates', async () => {
    const server = mockApi({ 'GET /projects': ({ query }) => paginated(projects, { page: Number(query.page), perPage: 3, total: 9 }) })
    const { user } = renderWithProviders(<ProjectList />, { route: '/projects' })
    await screen.findByText('Project 1')
    expect(screen.getByText('Showing 1–3 of 9')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Page 2' }))

    await waitFor(() => expect(lastList(server).page).toBe('2'))
    expect(screen.getByTestId('location')).toHaveTextContent('page=2')
  })

  describe('featured toggle', () => {
    it('sends only `featured` and shows the saved toast', async () => {
      const server = listServer({ 'PUT /projects/:id': ({ params, body }) => ({ data: { ...makeProject(Number(params.id)), ...body } }) })
      const { user } = renderWithProviders(<ProjectList />, { route: '/projects' })
      await screen.findByText('Project 2')

      await user.click(screen.getByRole('switch', { name: 'Featured: Project 2' }))

      await waitFor(() => expect(server.calls('PUT', '/projects/2')).toHaveLength(1))
      expect(server.calls('PUT', '/projects/2')[0].body).toEqual({ featured: true })
      expect(await screen.findByText('Saved')).toBeInTheDocument()
    })

    it('turns a featured project off', async () => {
      const server = listServer({ 'PUT /projects/:id': ({ params, body }) => ({ data: { ...makeProject(Number(params.id)), ...body } }) })
      const { user } = renderWithProviders(<ProjectList />, { route: '/projects' })
      await screen.findByText('Project 1')

      await user.click(screen.getByRole('switch', { name: 'Featured: Project 1' }))

      await waitFor(() => expect(server.calls('PUT', '/projects/1')[0]?.body).toEqual({ featured: false }))
    })

    it('reflects the requested value immediately while the request runs', async () => {
      let release
      const gate = new Promise((resolve) => {
        release = resolve
      })
      listServer({
        'PUT /projects/:id': async ({ params, body }) => {
          await gate
          return { data: { ...makeProject(Number(params.id)), ...body } }
        },
      })
      const { user } = renderWithProviders(<ProjectList />, { route: '/projects' })
      await screen.findByText('Project 2')
      const toggle = screen.getByRole('switch', { name: 'Featured: Project 2' })
      expect(toggle).toHaveAttribute('aria-checked', 'false')

      await user.click(toggle)

      expect(toggle).toHaveAttribute('aria-checked', 'true')
      release()
      await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument())
    })

    it('shows an error toast when the update fails', async () => {
      listServer({ 'PUT /projects/:id': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<ProjectList />, { route: '/projects' })
      await screen.findByText('Project 1')

      await user.click(screen.getByRole('switch', { name: 'Featured: Project 1' }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    })
  })

  describe('delete', () => {
    it('asks first (warning about team, links and images), then deletes and refreshes the list', async () => {
      const server = listServer({ 'DELETE /projects/:id': () => null })
      const { user } = renderWithProviders(<ProjectList />, { route: '/projects' })
      await screen.findByText('Project 2')

      await user.click(within(rowOf('Project 2')).getByRole('button', { name: 'Delete' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete project' })
      expect(dialog).toHaveTextContent('Delete the project “Project 2”?')
      expect(dialog).toHaveTextContent('team members, links and all of its images')
      expect(server.calls('DELETE')).toHaveLength(0)

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(server.calls('DELETE', '/projects/2')).toHaveLength(1))
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/projects').length).toBeGreaterThan(1))
    })

    it('warns in Arabic too', async () => {
      listServer({ 'DELETE /projects/:id': () => null })
      const { user } = renderWithProviders(<ProjectList />, { route: '/projects', lang: 'ar' })
      await screen.findByText('مشروع 2')

      await user.click(within(rowOf('مشروع 2')).getByRole('button', { name: 'حذف' }))

      expect(screen.getByRole('dialog', { name: 'حذف المشروع' })).toHaveTextContent('سيتم أيضًا حذف فريقه وروابطه وجميع صوره')
    })

    it('does nothing when the dialog is cancelled', async () => {
      const server = listServer({ 'DELETE /projects/:id': () => null })
      const { user } = renderWithProviders(<ProjectList />, { route: '/projects' })
      await screen.findByText('Project 2')

      await user.click(within(rowOf('Project 2')).getByRole('button', { name: 'Delete' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(server.calls('DELETE')).toHaveLength(0)
    })
  })

  describe('empty and error states', () => {
    it('invites to create the first project when there are none', async () => {
      mockApi({ 'GET /projects': () => paginated([]) })
      renderWithProviders(<ProjectList />, { route: '/projects' })

      expect(await screen.findByText('No projects yet')).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'New project' })).toHaveLength(2) // header + empty state
    })

    it('explains an empty filtered result instead', async () => {
      mockApi({ 'GET /projects': () => paginated([]) })
      renderWithProviders(<ProjectList />, { route: '/projects?category=erp' })

      expect(await screen.findByText('No results')).toBeInTheDocument()
      expect(screen.queryByText('No projects yet')).not.toBeInTheDocument()
    })

    it('shows a retryable error when the list cannot be loaded', async () => {
      const server = mockApi({ 'GET /projects': () => reply(500, { message: 'boom' }) })
      const { user } = renderWithProviders(<ProjectList />, { route: '/projects' })

      expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()

      server.on('GET /projects', () => paginated(projects))
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(await screen.findByText('Project 1')).toBeInTheDocument()
    })
  })

  describe('reorder mode', () => {
    it('loads every row (per_page 200), reorders optimistically and saves the new order', async () => {
      // a stateful fake: the reorder endpoint changes what the next GET returns, like the real API
      let stored = [...projects]
      const server = mockApi({
        'GET /projects': () => paginated(stored),
        'POST /projects/reorder': ({ body }) => {
          stored = body.ids.map((id) => stored.find((row) => row.id === id))
          return null
        },
      })
      const { user } = renderWithProviders(<ProjectList />, { route: '/projects' })
      await screen.findByText('Project 1')

      await user.click(screen.getByRole('button', { name: 'Reorder' }))

      await waitFor(() => expect(lastList(server)).toEqual({ per_page: '200', sort: 'order', dir: 'asc' }))
      const list = await screen.findByRole('list', { name: 'Projects' })
      expect(within(list).getAllByRole('listitem')).toHaveLength(3)
      expect(within(list).getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(3)
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()

      act(() => dnd.props.onDragEnd({ active: { id: 1 }, over: { id: 3 } })) // drop #1 on #3

      await waitFor(() => expect(server.calls('POST', '/projects/reorder')).toHaveLength(1))
      expect(server.calls('POST', '/projects/reorder')[0].body).toEqual({ ids: [2, 3, 1] })
      const names = within(screen.getByRole('list', { name: 'Projects' })).getAllByRole('listitem').map((item) => within(item).getByText(/Project \d/).textContent)
      expect(names).toEqual(['Project 2', 'Project 3', 'Project 1'])
      expect(await screen.findByText('Order saved')).toBeInTheDocument()
    })

    it('"Done" returns to the table', async () => {
      listServer()
      const { user } = renderWithProviders(<ProjectList />, { route: '/projects' })
      await screen.findByText('Project 1')
      await user.click(screen.getByRole('button', { name: 'Reorder' }))
      await screen.findByRole('list', { name: 'Projects' })

      await user.click(screen.getByRole('button', { name: 'Done' }))

      expect(await screen.findByRole('table')).toBeInTheDocument()
    })

    it('is unavailable when there are more rows than one page can hold', async () => {
      mockApi({ 'GET /projects': () => paginated(projects, { perPage: 15, total: 500 }) })
      renderWithProviders(<ProjectList />, { route: '/projects' })
      await screen.findByText('Project 1')

      expect(screen.getByRole('button', { name: 'Reorder' })).toBeDisabled()
    })
  })
})
