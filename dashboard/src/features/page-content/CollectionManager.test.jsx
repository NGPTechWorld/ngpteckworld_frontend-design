import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockApi, paginated, reply } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import { contentRoutes, makeItem } from './fixtures'

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

const { CollectionManager } = await import('./CollectionManager')

const whyUs = [makeItem(1, 'why_us'), makeItem(2, 'why_us', { is_active: false }), makeItem(3, 'why_us')]

function setup({ collection = 'why_us', items = whyUs, extra, ...options } = {}) {
  const fake = contentRoutes({ items })
  const server = mockApi({ ...fake.routes, ...extra })
  const onAdd = vi.fn()
  const onEdit = vi.fn()
  const view = renderWithProviders(<CollectionManager collection={collection} onAdd={onAdd} onEdit={onEdit} />, options)
  return { fake, server, onAdd, onEdit, ...view }
}

const rowOf = (title) => screen.getByText(title).closest('li')
const titlesInOrder = () => within(screen.getByRole('list', { name: 'Why choose us' })).getAllByRole('listitem').map((item) => within(item).getByText(/^Title \d$/).textContent)

describe('CollectionManager — list', () => {
  it('asks for its collection only, all of it (per_page 200), and lists titles in both languages with the description', async () => {
    const { server } = setup()

    expect(await screen.findByText('Title 1')).toBeInTheDocument()
    expect(server.calls('GET', '/content-items')[0].query).toEqual({ collection: 'why_us', per_page: '200', sort: 'order', dir: 'asc' })
    expect(screen.getByRole('heading', { level: 2, name: 'Why choose us' })).toBeInTheDocument()
    expect(within(rowOf('Title 1')).getByText('عنوان 1')).toHaveAttribute('dir', 'rtl') // the other language, smaller
    expect(within(rowOf('Title 1')).getByText('Body 1')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Why choose us' })).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Add reason' })).toBeInTheDocument()
  })

  it('shows Arabic first in the Arabic UI', async () => {
    setup({ lang: 'ar' })

    expect(await screen.findByText('عنوان 1')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'لماذا تختارنا؟' })).toBeInTheDocument()
    expect(within(rowOf('عنوان 1')).getByText('Title 1')).toHaveAttribute('dir', 'ltr')
    expect(screen.getByRole('button', { name: 'إضافة سبب' })).toBeInTheDocument()
  })

  it('marks inactive items as hidden on the site and dims them', async () => {
    setup()
    await screen.findByText('Title 2')

    expect(within(rowOf('Title 2')).getByText('Hidden on the site')).toBeInTheDocument()
    expect(within(rowOf('Title 1')).queryByText('Hidden on the site')).not.toBeInTheDocument()
    expect(within(rowOf('Title 2')).getByRole('switch', { name: 'Active: Title 2' })).toHaveAttribute('aria-checked', 'false')
    expect(within(rowOf('Title 1')).getByRole('switch', { name: 'Active: Title 1' })).toHaveAttribute('aria-checked', 'true')
  })

  it('warns that the built-in list is shown when every item is inactive', async () => {
    setup({ items: [makeItem(1, 'why_us', { is_active: false }), makeItem(2, 'why_us', { is_active: false })] })
    expect(await screen.findByText('Every item is inactive, so the website shows its built-in list.')).toBeInTheDocument()
  })

  it('does not warn while at least one item is active', async () => {
    setup()
    await screen.findByText('Title 1')
    expect(screen.queryByText(/Every item is inactive/)).not.toBeInTheDocument()
  })

  it('shows a skeleton while loading', () => {
    setup()
    expect(screen.getByText('Loading…').closest('[aria-busy="true"]')).toBeInTheDocument()
  })

  it('values show their icon and no description', async () => {
    setup({ collection: 'values', items: [makeItem(1, 'values', { icon_key: 'innovation' }), makeItem(2, 'values', { icon_key: null })] })

    expect(await screen.findByText('Title 1')).toBeInTheDocument()
    expect(within(rowOf('Title 1')).queryByText(/^Body/)).not.toBeInTheDocument()
    expect(rowOf('Title 1').querySelector('.lucide-lightbulb')).toBeInTheDocument()
    expect(rowOf('Title 2').querySelector('.lucide-star')).toBeInTheDocument() // no icon = "quality", like the public site
    expect(screen.getByRole('button', { name: 'Add value' })).toBeInTheDocument()
  })
})

describe('CollectionManager — empty and error states', () => {
  it('explains that the website shows its built-in list when there are no items', async () => {
    setup({ items: [] })

    expect(await screen.findByText('No reasons yet')).toBeInTheDocument()
    expect(screen.getByText(/The website is showing its built-in list of reasons/)).toBeInTheDocument()
    expect(screen.getByText(/shows only your reasons/)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add reason' })).toBeInTheDocument()
  })

  it('has its own wording for each collection', async () => {
    setup({ collection: 'process_steps', items: [] })
    expect(await screen.findByText('No steps yet')).toBeInTheDocument()
    expect(screen.getByText(/built-in list of steps/)).toBeInTheDocument()
  })

  it('shows a retryable error when the list cannot be loaded', async () => {
    const { user, server } = setup({ extra: { 'GET /content-items': () => reply(500, { message: 'boom' }) } })

    expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()
    expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()

    server.on('GET /content-items', () => paginated(whyUs))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Title 1')).toBeInTheDocument()
  })

  it('disables reordering (and says why) when there are more items than one request can hold', async () => {
    setup({ extra: { 'GET /content-items': () => paginated(whyUs, { perPage: 200, total: 500 }) } })

    expect(await screen.findByText('More than 200 items — reordering is not available here.')).toBeInTheDocument()
    for (const handle of screen.getAllByRole('button', { name: 'Drag to reorder' })) expect(handle).toBeDisabled()
  })
})

describe('CollectionManager — actions', () => {
  it('asks the page to open the modal to add or to edit', async () => {
    const { user, onAdd, onEdit } = setup()
    await screen.findByText('Title 1')

    await user.click(screen.getByRole('button', { name: 'Add reason' }))
    expect(onAdd).toHaveBeenCalledWith('why_us')

    await user.click(screen.getByRole('button', { name: 'Edit: Title 3' }))
    expect(onEdit).toHaveBeenCalledWith('why_us', expect.objectContaining({ id: 3, title_en: 'Title 3' }))
  })

  describe('active toggle', () => {
    it('sends only is_active and shows the saved toast', async () => {
      const { user, server } = setup()
      await screen.findByText('Title 1')

      await user.click(screen.getByRole('switch', { name: 'Active: Title 1' }))

      await waitFor(() => expect(server.calls('PUT', '/content-items/1')).toHaveLength(1))
      expect(server.calls('PUT', '/content-items/1')[0].body).toEqual({ is_active: false })
      expect(await screen.findByText('Saved')).toBeInTheDocument()
      await waitFor(() => expect(within(rowOf('Title 1')).getByText('Hidden on the site')).toBeInTheDocument())
    })

    it('turns an inactive item on', async () => {
      const { user, server } = setup()
      await screen.findByText('Title 2')

      await user.click(screen.getByRole('switch', { name: 'Active: Title 2' }))

      await waitFor(() => expect(server.calls('PUT', '/content-items/2')[0]?.body).toEqual({ is_active: true }))
    })

    it('reflects the requested value at once while the request runs', async () => {
      let release
      const gate = new Promise((resolve) => {
        release = resolve
      })
      const { user, server, fake } = setup()
      server.on('PUT /content-items/:id', async ({ params, body }) => {
        await gate
        fake.state.items = fake.state.items.map((item) => (item.id === Number(params.id) ? { ...item, ...body } : item))
        return { data: fake.state.items.find((item) => item.id === Number(params.id)) }
      })
      await screen.findByText('Title 2')
      const toggle = screen.getByRole('switch', { name: 'Active: Title 2' })

      await user.click(toggle)

      expect(toggle).toHaveAttribute('aria-checked', 'true')
      release()
      expect(await screen.findByText('Saved')).toBeInTheDocument()
    })

    it('shows an error toast when the update fails', async () => {
      const { user } = setup({ extra: { 'PUT /content-items/:id': () => reply(500, { message: 'boom' }) } })
      await screen.findByText('Title 1')

      await user.click(screen.getByRole('switch', { name: 'Active: Title 1' }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
      expect(screen.getByRole('switch', { name: 'Active: Title 1' })).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('delete', () => {
    it('asks first, then deletes and refreshes the list', async () => {
      const { user, server } = setup()
      await screen.findByText('Title 2')

      await user.click(screen.getByRole('button', { name: 'Delete: Title 2' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete reason' })
      expect(dialog).toHaveTextContent('Delete the reason “Title 2”? This cannot be undone.')
      expect(server.calls('DELETE')).toHaveLength(0)

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(server.calls('DELETE', '/content-items/2')).toHaveLength(1))
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
      await waitFor(() => expect(screen.queryByText('Title 2')).not.toBeInTheDocument())
      expect(screen.getByText('Title 1')).toBeInTheDocument()
    })

    it('does nothing when the dialog is cancelled', async () => {
      const { user, server } = setup()
      await screen.findByText('Title 2')

      await user.click(screen.getByRole('button', { name: 'Delete: Title 2' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(server.calls('DELETE')).toHaveLength(0)
      expect(screen.getByText('Title 2')).toBeInTheDocument()
    })

    it('falls back to the built-in list explanation after the last item is deleted', async () => {
      const { user } = setup({ items: [makeItem(1, 'why_us')] })
      await screen.findByText('Title 1')

      await user.click(screen.getByRole('button', { name: 'Delete: Title 1' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))

      expect(await screen.findByText('No reasons yet')).toBeInTheDocument()
    })
  })

  describe('reorder', () => {
    it('sends the ids of the whole collection in the new order and re-sorts at once', async () => {
      const { server } = setup()
      await screen.findByText('Title 1')
      expect(titlesInOrder()).toEqual(['Title 1', 'Title 2', 'Title 3'])

      act(() => dnd.props.onDragEnd({ active: { id: 1 }, over: { id: 3 } })) // drop #1 on #3

      await waitFor(() => expect(server.calls('POST', '/content-items/reorder')).toHaveLength(1))
      expect(server.calls('POST', '/content-items/reorder')[0].body).toEqual({ ids: [2, 3, 1] })
      expect(titlesInOrder()).toEqual(['Title 2', 'Title 3', 'Title 1'])
      expect(await screen.findByText('Order saved')).toBeInTheDocument()
      await waitFor(() => expect(titlesInOrder()).toEqual(['Title 2', 'Title 3', 'Title 1'])) // still so after the refetch
    })

    it('puts the order back and says so when saving it fails', async () => {
      setup({ extra: { 'POST /content-items/reorder': () => reply(500, { message: 'boom' }) } })
      await screen.findByText('Title 1')

      act(() => dnd.props.onDragEnd({ active: { id: 3 }, over: { id: 1 } }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
      await waitFor(() => expect(titlesInOrder()).toEqual(['Title 1', 'Title 2', 'Title 3']))
    })

    it('ignores a drop on the same place', async () => {
      const { server } = setup()
      await screen.findByText('Title 1')

      act(() => dnd.props.onDragEnd({ active: { id: 2 }, over: { id: 2 } }))
      act(() => dnd.props.onDragEnd({ active: { id: 2 }, over: null }))

      expect(server.calls('POST', '/content-items/reorder')).toHaveLength(0)
    })
  })
})
