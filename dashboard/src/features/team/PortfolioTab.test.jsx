import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, paginated, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import { PortfolioTab } from './PortfolioTab'

const makeItem = (id, over = {}) => ({
  id,
  team_profile_id: 5,
  title_ar: `عمل ${id}`, title_en: `Item ${id}`,
  description_ar: 'وصف', description_en: 'Description',
  cover_image: null, cover_image_url: null,
  gallery: [], gallery_urls: [],
  video_url: null,
  order: id,
  created_at: '2026-09-01T10:00:00.000000Z', updated_at: '2026-09-01T10:00:00.000000Z',
  ...over,
})

/** A stateful fake of the nested portfolio endpoints, like the real API. */
function portfolioServer({ initial = [makeItem(1), makeItem(2)], extra = {} } = {}) {
  let stored = [...initial]
  let nextId = 10
  return mockApi({
    'GET /team/:id/portfolio': () => paginated(stored),
    'POST /team/:id/portfolio': ({ body }) => {
      const item = makeItem(nextId++, body)
      stored = [...stored, item]
      return reply(201, { data: item })
    },
    'PUT /team/:id/portfolio/:itemId': ({ params, body }) => {
      stored = stored.map((item) => (item.id === Number(params.itemId) ? { ...item, ...body } : item))
      return { data: stored.find((item) => item.id === Number(params.itemId)) }
    },
    'DELETE /team/:id/portfolio/:itemId': ({ params }) => {
      stored = stored.filter((item) => item.id !== Number(params.itemId))
      return null
    },
    ...extra,
  })
}
const dialogOf = (name) => within(screen.getByRole('dialog', { name }))

describe('PortfolioTab', () => {
  it('lists the items with their title in both languages', async () => {
    portfolioServer()
    renderWithProviders(<PortfolioTab teamId={5} />, { route: '/team/5' })

    expect(await screen.findByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('عمل 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New item' })).toBeInTheDocument()
  })

  it('shows an empty state without items', async () => {
    mockApi({ 'GET /team/:id/portfolio': () => paginated([]) })
    renderWithProviders(<PortfolioTab teamId={5} />, { route: '/team/5' })

    expect(await screen.findByText('No portfolio items yet')).toBeInTheDocument()
  })

  it('creates an item and refreshes the list', async () => {
    const server = portfolioServer()
    const { user } = renderWithProviders(<PortfolioTab teamId={5} />, { route: '/team/5' })
    await screen.findByText('Item 1')

    await user.click(screen.getByRole('button', { name: 'New item' }))
    const dialog = dialogOf('New item')
    await user.type(dialog.getByLabelText('Title (Arabic)'), 'مشروع جديد')
    await user.type(dialog.getByLabelText('Title (English)'), 'New project')
    await user.type(dialog.getByLabelText('Description (Arabic)'), 'وصف المشروع')
    await user.type(dialog.getByLabelText('Description (English)'), 'Project description')

    await user.click(dialog.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/team/5/portfolio')).toHaveLength(1))
    expect(server.calls('POST', '/team/5/portfolio')[0].body).toMatchObject({
      title_ar: 'مشروع جديد', title_en: 'New project', description_ar: 'وصف المشروع', description_en: 'Project description',
      cover_image: null, gallery: [], video_url: null,
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Saved')).toBeInTheDocument()
    expect(await screen.findByText('New project')).toBeInTheDocument()
  })

  it('validates the required fields and sends nothing', async () => {
    const server = portfolioServer()
    const { user } = renderWithProviders(<PortfolioTab teamId={5} />, { route: '/team/5' })
    await screen.findByText('Item 1')

    await user.click(screen.getByRole('button', { name: 'New item' }))
    await user.click(dialogOf('New item').getByRole('button', { name: 'Save' }))

    expect(await dialogOf('New item').findAllByText('This field is required')).toHaveLength(4) // title + description × ar/en
    expect(server.calls('POST', '/team/5/portfolio')).toHaveLength(0)
  })

  it('opens the dialog filled with the item and saves the changes', async () => {
    const server = portfolioServer()
    const { user } = renderWithProviders(<PortfolioTab teamId={5} />, { route: '/team/5' })
    await screen.findByText('Item 1')

    await user.click(screen.getByRole('button', { name: 'Edit "Item 1"' }))
    const dialog = dialogOf('Edit item')
    expect(dialog.getByLabelText('Title (English)')).toHaveValue('Item 1')

    await user.clear(dialog.getByLabelText('Title (English)'))
    await user.type(dialog.getByLabelText('Title (English)'), 'Renamed')
    await user.click(dialog.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('PUT', '/team/5/portfolio/1')).toHaveLength(1))
    expect(server.calls('PUT', '/team/5/portfolio/1')[0].body.title_en).toBe('Renamed')
  })

  it('maps a 422 onto the dialog fields and keeps it open', async () => {
    // valid on the client (so the request actually goes out) but rejected server-side — a business rule
    // no client check covers, e.g. a title that collides with something else.
    portfolioServer({ extra: { 'POST /team/:id/portfolio': () => validationError({ title_en: ['That title is already used.'] }) } })
    const { user } = renderWithProviders(<PortfolioTab teamId={5} />, { route: '/team/5' })
    await screen.findByText('Item 1')
    await user.click(screen.getByRole('button', { name: 'New item' }))
    const dialog = dialogOf('New item')
    await user.type(dialog.getByLabelText('Title (Arabic)'), 'مشروع')
    await user.type(dialog.getByLabelText('Title (English)'), 'Duplicate')
    await user.type(dialog.getByLabelText('Description (Arabic)'), 'وصف')
    await user.type(dialog.getByLabelText('Description (English)'), 'Description')

    await user.click(dialog.getByRole('button', { name: 'Save' }))

    expect(await dialog.findByText('That title is already used.')).toBeInTheDocument()
    expect(dialog.getByLabelText('Title (English)')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('asks first, then deletes the item', async () => {
    const server = portfolioServer()
    const { user } = renderWithProviders(<PortfolioTab teamId={5} />, { route: '/team/5' })
    await screen.findByText('Item 1')

    await user.click(screen.getByRole('button', { name: 'Delete "Item 2"' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete item' })
    expect(server.calls('DELETE')).toHaveLength(0)

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(server.calls('DELETE', '/team/5/portfolio/2')).toHaveLength(1))
    await waitFor(() => expect(screen.queryByText('Item 2')).not.toBeInTheDocument())
  })

  it('shows a loading error with a retry button', async () => {
    const server = mockApi({ 'GET /team/:id/portfolio': () => reply(500, { message: 'boom' }) })
    const { user } = renderWithProviders(<PortfolioTab teamId={5} />, { route: '/team/5' })

    expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()

    server.on('GET /team/:id/portfolio', () => paginated([makeItem(1)]))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Item 1')).toBeInTheDocument()
  })
})
