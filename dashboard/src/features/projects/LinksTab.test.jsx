import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockApi, paginated, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import { dropOn } from './dndCapture'
import ProjectEdit from './ProjectEdit'
import './testTimeouts'
import { enter, makeLink, showProject } from './testUtils'

vi.mock('@dnd-kit/core', async (importOriginal) => (await import('./dndCapture')).withDndCapture(await importOriginal()))

const links = () => [
  makeLink(1, { type: 'website', url: 'https://acme.example.com' }),
  makeLink(2, { type: 'github', url: 'https://github.com/acme/portal' }),
  makeLink(3, { type: 'x', url: 'https://x.com/acme' }),
]

/** A stateful fake of the project + its link endpoints, like the real API. */
function linksServer({ initial = links(), extra = {} } = {}) {
  let stored = [...initial]
  let nextId = 10
  return mockApi({
    'GET /projects/:id': () => ({ data: showProject(7, { links: stored, team_members: [] }) }),
    'GET /projects/:id/links': () => paginated(stored),
    'POST /projects/:id/links': ({ body }) => {
      const link = makeLink(nextId++, body)
      stored = [...stored, link]
      return reply(201, { data: link })
    },
    'PUT /projects/:id/links/:linkId': ({ params, body }) => {
      stored = stored.map((link) => (link.id === Number(params.linkId) ? { ...link, ...body } : link))
      return { data: stored.find((link) => link.id === Number(params.linkId)) }
    },
    'DELETE /projects/:id/links/:linkId': ({ params }) => {
      stored = stored.filter((link) => link.id !== Number(params.linkId))
      return null
    },
    'POST /projects/:id/links/reorder': ({ body }) => {
      stored = body.ids.map((id) => stored.find((link) => link.id === id))
      return null
    },
    ...extra,
  })
}

async function openLinks({ lang } = {}) {
  const view = renderWithProviders(<ProjectEdit />, { route: '/projects/7?tab=links', path: '/projects/:id', lang })
  await screen.findByRole('list', { name: lang === 'ar' ? 'روابط المشروع' : 'Project links' })
  return view
}
const linksTab = () => screen.getByRole('tab', { name: /^(Links|الروابط)/ })
const dialogOf = (name) => within(screen.getByRole('dialog', { name }))
const urls = () => within(screen.getByRole('list', { name: 'Project links' })).getAllByRole('listitem').map((item) => within(item).getByRole('link').getAttribute('href'))

describe('Links tab', () => {
  it('lists the links with their type and a safe external anchor', async () => {
    linksServer()
    await openLinks()

    const row = within(screen.getByRole('link', { name: /github.com\/acme\/portal/ }).closest('li'))
    expect(row.getByText('GitHub')).toBeInTheDocument()
    expect(row.getByRole('link')).toHaveAttribute('href', 'https://github.com/acme/portal')
    expect(row.getByRole('link')).toHaveAttribute('target', '_blank')
    expect(row.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer')
    expect(row.getByRole('link')).toHaveAttribute('dir', 'ltr')
    expect(row.getByRole('button', { name: 'Drag to reorder' })).toBeInTheDocument()
    expect(row.getByRole('button', { name: 'Edit: https://github.com/acme/portal' })).toBeInTheDocument()
    expect(within(screen.getByRole('link', { name: /acme.example.com/ }).closest('li')).getByText('Website')).toBeInTheDocument()
    expect(within(screen.getByRole('link', { name: /x.com\/acme/ }).closest('li')).getByText('X')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add link' })).toBeInTheDocument()
    expect(linksTab()).toHaveAccessibleName(/^Links\s*3$/)
  })

  it('shows the type names in Arabic', async () => {
    linksServer()
    await openLinks({ lang: 'ar' })

    expect(within(screen.getByRole('link', { name: /acme.example.com/ }).closest('li')).getByText('الموقع الإلكتروني')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'إضافة رابط' })).toBeInTheDocument()
  })

  it('does not turn a non-http URL into a clickable link', async () => {
    linksServer({ initial: [makeLink(1, { url: 'javascript:alert(1)' })] })
    await openLinks()

    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /javascript/ })).not.toBeInTheDocument()
  })

  it('shows an empty state without links', async () => {
    linksServer({ initial: [] })
    renderWithProviders(<ProjectEdit />, { route: '/projects/7?tab=links', path: '/projects/:id' })

    expect(await screen.findByText('No links yet')).toBeInTheDocument()
    await waitFor(() => expect(linksTab()).toHaveAccessibleName(/^Links\s*0$/))
  })

  it('shows a loading error with a retry button', async () => {
    const server = linksServer({ extra: { 'GET /projects/:id/links': () => reply(500, { message: 'boom' }) } })
    const { user } = renderWithProviders(<ProjectEdit />, { route: '/projects/7?tab=links', path: '/projects/:id' })

    expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()

    server.on('GET /projects/:id/links', () => paginated(links()))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('link', { name: /acme.example.com/ })).toBeInTheDocument()
  })

  describe('add', () => {
    it('opens a dialog with the URL focused, all nine types and Website preselected; Cancel closes it', async () => {
      const server = linksServer()
      const { user } = await openLinks()

      await user.click(screen.getByRole('button', { name: 'Add link' }))

      const dialog = dialogOf('Add a link')
      expect(dialog.getByLabelText(/^URL/)).toHaveFocus()
      expect(dialog.getByLabelText(/^URL/)).toHaveAttribute('dir', 'ltr')
      const type = dialog.getByLabelText(/^Type/)
      expect(type).toHaveValue('website')
      expect(within(type).getAllByRole('option').map((option) => option.getAttribute('value'))).toEqual(['website', 'github', 'behance', 'instagram', 'facebook', 'linkedin', 'x', 'whatsapp', 'other'])

      await user.click(dialog.getByRole('button', { name: 'Cancel' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(server.calls('POST')).toHaveLength(0)
    })

    it('validates the URL locally and sends nothing', async () => {
      const server = linksServer()
      const { user } = await openLinks()
      await user.click(screen.getByRole('button', { name: 'Add link' }))

      await user.click(dialogOf('Add a link').getByRole('button', { name: 'Save' }))
      expect(await screen.findByText('This field is required')).toBeInTheDocument()

      await enter(user, dialogOf('Add a link').getByLabelText(/^URL/), 'javascript:alert(1)')
      await user.click(dialogOf('Add a link').getByRole('button', { name: 'Save' }))
      expect(await screen.findByText('Enter a valid URL (starting with http:// or https://)')).toBeInTheDocument()
      expect(server.calls('POST')).toHaveLength(0)
    })

    it('creates the link, refreshes the list and the counts', async () => {
      const server = linksServer()
      const { user } = await openLinks()
      const before = server.calls('GET', '/projects/7').length
      await user.click(screen.getByRole('button', { name: 'Add link' }))
      const dialog = dialogOf('Add a link')

      await user.selectOptions(dialog.getByLabelText(/^Type/), 'linkedin')
      await enter(user, dialog.getByLabelText(/^URL/), 'https://linkedin.com/company/acme')
      await user.click(dialog.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(server.calls('POST', '/projects/7/links')).toHaveLength(1))
      expect(server.calls('POST', '/projects/7/links')[0].body).toEqual({ type: 'linkedin', url: 'https://linkedin.com/company/acme' })
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(await screen.findByRole('link', { name: /linkedin.com\/company\/acme/ })).toBeInTheDocument()
      expect(await screen.findByText('Saved')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/projects/7').length).toBeGreaterThan(before))
      await waitFor(() => expect(linksTab()).toHaveAccessibleName(/^Links\s*4$/))
      expect(server.calls('PUT', '/projects/7')).toHaveLength(0) // saving a link never submits the project form
    })

    it('maps a 422 onto the fields and keeps the dialog open', async () => {
      linksServer({ extra: { 'POST /projects/:id/links': () => validationError({ url: ['The url field must be a valid URL.'], type: ['The selected type is invalid.'] }) } })
      const { user } = await openLinks()
      await user.click(screen.getByRole('button', { name: 'Add link' }))
      const dialog = dialogOf('Add a link')
      await enter(user, dialog.getByLabelText(/^URL/), 'https://example.com')

      await user.click(dialog.getByRole('button', { name: 'Save' }))

      expect(await dialog.findByText('The url field must be a valid URL.')).toBeInTheDocument()
      expect(dialog.getByText('The selected type is invalid.')).toBeInTheDocument()
      expect(dialog.getByLabelText(/^URL/)).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('edit', () => {
    it('opens the dialog filled with the link and saves the changes', async () => {
      const server = linksServer()
      const { user } = await openLinks()

      await user.click(screen.getByRole('button', { name: 'Edit: https://github.com/acme/portal' }))

      const dialog = dialogOf('Edit link')
      expect(dialog.getByLabelText(/^Type/)).toHaveValue('github')
      expect(dialog.getByLabelText(/^URL/)).toHaveValue('https://github.com/acme/portal')

      await user.selectOptions(dialog.getByLabelText(/^Type/), 'behance')
      await user.clear(dialog.getByLabelText(/^URL/))
      await enter(user, dialog.getByLabelText(/^URL/), 'https://behance.net/acme')
      await user.click(dialog.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(server.calls('PUT', '/projects/7/links/2')).toHaveLength(1))
      expect(server.calls('PUT', '/projects/7/links/2')[0].body).toEqual({ type: 'behance', url: 'https://behance.net/acme' })
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(await screen.findByRole('link', { name: /behance.net\/acme/ })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /github.com/ })).not.toBeInTheDocument()
    })

    it('maps a 422 onto the fields', async () => {
      linksServer({ extra: { 'PUT /projects/:id/links/:linkId': () => validationError({ url: ['Nope.'] }) } })
      const { user } = await openLinks()
      await user.click(screen.getByRole('button', { name: 'Edit: https://x.com/acme' }))

      await user.click(dialogOf('Edit link').getByRole('button', { name: 'Save' }))

      expect(await screen.findByText('Nope.')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('delete', () => {
    it('asks first, then deletes the link and refreshes the list and the counts', async () => {
      const server = linksServer()
      const { user } = await openLinks()

      await user.click(screen.getByRole('button', { name: 'Delete: https://x.com/acme' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete link' })
      expect(dialog).toHaveTextContent('Delete the link “https://x.com/acme”?')
      expect(server.calls('DELETE')).toHaveLength(0)

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(server.calls('DELETE', '/projects/7/links/3')).toHaveLength(1))
      await waitFor(() => expect(screen.queryByRole('link', { name: /x.com\/acme/ })).not.toBeInTheDocument())
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
      await waitFor(() => expect(linksTab()).toHaveAccessibleName(/^Links\s*2$/))
    })

    it('does nothing when cancelled', async () => {
      const server = linksServer()
      const { user } = await openLinks()

      await user.click(screen.getByRole('button', { name: 'Delete: https://x.com/acme' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(server.calls('DELETE')).toHaveLength(0)
      expect(screen.getByRole('link', { name: /x.com\/acme/ })).toBeInTheDocument()
    })
  })

  describe('reorder', () => {
    it('reorders optimistically, saves the ids of the whole list and refreshes the parent', async () => {
      const server = linksServer()
      await openLinks()
      const before = server.calls('GET', '/projects/7').length

      dropOn(screen.getByRole('list', { name: 'Project links' }), 1, 3) // drop the website link on the last place

      await waitFor(() => expect(server.calls('POST', '/projects/7/links/reorder')).toHaveLength(1))
      expect(server.calls('POST', '/projects/7/links/reorder')[0].body).toEqual({ ids: [2, 3, 1] })
      expect(urls()).toEqual(['https://github.com/acme/portal', 'https://x.com/acme', 'https://acme.example.com'])
      expect(await screen.findByText('Order saved')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/projects/7').length).toBeGreaterThan(before))
      await waitFor(() => expect(urls()).toEqual(['https://github.com/acme/portal', 'https://x.com/acme', 'https://acme.example.com']))
    })

    it('puts the list back and toasts when saving the order fails', async () => {
      linksServer({ extra: { 'POST /projects/:id/links/reorder': () => reply(500, { message: 'boom' }) } })
      await openLinks()

      dropOn(screen.getByRole('list', { name: 'Project links' }), 1, 3)

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
      await waitFor(() => expect(urls()).toEqual(['https://acme.example.com', 'https://github.com/acme/portal', 'https://x.com/acme']))
    })
  })
})
