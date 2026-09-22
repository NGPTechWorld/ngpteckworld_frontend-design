import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockApi, paginated, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import { dropOn } from './dndCapture'
import ProjectEdit from './ProjectEdit'
import './testTimeouts'
import { enter, makeMember, showProject } from './testUtils'

vi.mock('@dnd-kit/core', async (importOriginal) => (await import('./dndCapture')).withDndCapture(await importOriginal()))

const png = (name) => new File([new Uint8Array(10)], name, { type: 'image/png' })
const members = () => [
  makeMember(1, { name: 'Sara', role_ar: 'مطورة', role_en: 'Developer', tasks_ar: ['واجهات'], tasks_en: ['UI', 'Testing'], avatar: 'team/sara.png', avatar_url: 'http://localhost/media/team/sara.png' }),
  makeMember(2, { name: 'Omar', role_ar: 'مصمم', role_en: 'Designer' }),
]

/** A stateful fake of the project + its team-member endpoints, like the real API. */
function teamServer({ initial = members(), extra = {} } = {}) {
  let stored = [...initial]
  let nextId = 10
  const server = mockApi({
    'GET /projects/:id': () => ({ data: showProject(7, { team_members: stored, links: [] }) }),
    'GET /projects/:id/team-members': () => paginated(stored),
    'POST /projects/:id/team-members': ({ body }) => {
      const member = makeMember(nextId++, body)
      stored = [...stored, member]
      return reply(201, { data: member })
    },
    'PUT /projects/:id/team-members/:memberId': ({ params, body }) => {
      stored = stored.map((member) => (member.id === Number(params.memberId) ? { ...member, ...body } : member))
      return { data: stored.find((member) => member.id === Number(params.memberId)) }
    },
    'DELETE /projects/:id/team-members/:memberId': ({ params }) => {
      stored = stored.filter((member) => member.id !== Number(params.memberId))
      return null
    },
    'POST /projects/:id/team-members/reorder': ({ body }) => {
      stored = body.ids.map((id) => stored.find((member) => member.id === id))
      return null
    },
    ...extra,
  })
  return server
}

async function openTeam({ lang } = {}) {
  const view = renderWithProviders(<ProjectEdit />, { route: '/projects/7?tab=team', path: '/projects/:id', lang })
  await screen.findByRole('list', { name: lang === 'ar' ? 'أعضاء الفريق' : 'Team members' })
  return view
}
const teamTab = () => screen.getByRole('tab', { name: /^(Team|الفريق)/ })
const dialogOf = (name) => within(screen.getByRole('dialog', { name }))

describe('Team tab', () => {
  it('lists the members with avatar, name, role in both languages and the number of tasks', async () => {
    teamServer()
    await openTeam()

    const sara = within(screen.getByText('Sara').closest('li'))
    expect(sara.getByText('Developer')).toBeInTheDocument()
    expect(sara.getByText('مطورة')).toBeInTheDocument()
    expect(sara.getByText(/2 tasks/)).toBeInTheDocument()
    expect(sara.getByRole('button', { name: 'Drag to reorder' })).toBeInTheDocument()
    expect(sara.getByRole('button', { name: 'Edit: Sara' })).toBeInTheDocument()
    expect(sara.getByRole('button', { name: 'Delete: Sara' })).toBeInTheDocument()
    expect(screen.getByText('Sara').closest('li').querySelector('img')).toHaveAttribute('src', 'http://localhost/media/team/sara.png')
    expect(within(screen.getByText('Omar').closest('li')).getByText('Designer')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add member' })).toBeInTheDocument()
    expect(teamTab()).toHaveAccessibleName(/^Team\s*2$/)
  })

  it('shows the Arabic role first in the Arabic UI', async () => {
    teamServer()
    await openTeam({ lang: 'ar' })

    const sara = within(screen.getByText('Sara').closest('li'))
    expect(sara.getByText('مطورة')).toBeInTheDocument()
    expect(sara.getByText('Developer')).toBeInTheDocument()
    expect(sara.getByText(/مهمتان/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'إضافة عضو' })).toBeInTheDocument()
  })

  it('shows an empty state without members', async () => {
    teamServer({ initial: [] })
    renderWithProviders(<ProjectEdit />, { route: '/projects/7?tab=team', path: '/projects/:id' })

    expect(await screen.findByText('No team members yet')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Team members' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add member' })).toBeInTheDocument()
    await waitFor(() => expect(teamTab()).toHaveAccessibleName(/^Team\s*0$/))
  })

  it('shows a loading error with a retry button', async () => {
    const server = teamServer({ extra: { 'GET /projects/:id/team-members': () => reply(500, { message: 'boom' }) } })
    const { user } = renderWithProviders(<ProjectEdit />, { route: '/projects/7?tab=team', path: '/projects/:id' })

    expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()
    expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument()

    server.on('GET /projects/:id/team-members', () => paginated(members()))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Sara')).toBeInTheDocument()
  })

  describe('add', () => {
    it('opens a dialog with the focus on the name, and Cancel / Esc close it without a request', async () => {
      const server = teamServer()
      const { user } = await openTeam()

      await user.click(screen.getByRole('button', { name: 'Add member' }))
      const dialog = dialogOf('Add a team member')
      expect(dialog.getByLabelText(/^Name/)).toHaveFocus()
      expect(dialog.getByLabelText('Role (Arabic)')).toHaveAttribute('dir', 'rtl')
      expect(dialog.getByLabelText('Role (English)')).toHaveAttribute('dir', 'ltr')
      expect(dialog.getByLabelText('Tasks (Arabic)')).toBeInTheDocument()
      expect(dialog.getByTestId('image-input')).toBeInTheDocument()

      await user.click(dialog.getByRole('button', { name: 'Cancel' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Add member' }))
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(server.calls('POST')).toHaveLength(0)
    })

    it('validates the required fields inside the dialog and sends nothing', async () => {
      const server = teamServer()
      const { user } = await openTeam()
      await user.click(screen.getByRole('button', { name: 'Add member' }))

      await user.click(dialogOf('Add a team member').getByRole('button', { name: 'Save' }))

      expect(await dialogOf('Add a team member').findAllByText('This field is required')).toHaveLength(3) // name + both roles
      expect(server.calls('POST')).toHaveLength(0)
    })

    it('creates the member with tasks and an avatar, refreshes the list and the counts', async () => {
      const server = teamServer()
      const { user } = await openTeam()
      const parentLoads = () => server.calls('GET', '/projects/7').length
      const before = parentLoads()
      await user.click(screen.getByRole('button', { name: 'Add member' }))
      const dialog = dialogOf('Add a team member')

      await enter(user, dialog.getByLabelText(/^Name/), 'Layla')
      await enter(user, dialog.getByLabelText('Role (Arabic)'), 'محللة')
      await enter(user, dialog.getByLabelText('Role (English)'), 'Analyst')
      await user.type(dialog.getByLabelText('Tasks (Arabic)'), 'تحليل{Enter}')
      await user.type(dialog.getByLabelText('Tasks (English)'), 'Analysis{Enter}Docs{Enter}')
      expect(server.calls('POST', '/projects/7/team-members')).toHaveLength(0) // Enter adds a tag, it does not submit
      server.on('POST /uploads', ({ body }) => reply(201, { data: { path: `${body.get('folder')}/${body.get('file').name}`, url: `http://localhost/media/${body.get('folder')}/${body.get('file').name}` } }))
      await user.upload(dialog.getByTestId('image-input'), png('layla.png'))
      await waitFor(() => expect(dialog.getByRole('img', { name: 'Image preview' })).toHaveAttribute('src', 'http://localhost/media/team/layla.png'))

      await user.click(dialog.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(server.calls('POST', '/projects/7/team-members')).toHaveLength(1))
      expect(server.calls('POST', '/projects/7/team-members')[0].body).toEqual({
        name: 'Layla',
        role_ar: 'محللة',
        role_en: 'Analyst',
        tasks_ar: ['تحليل'],
        tasks_en: ['Analysis', 'Docs'],
        avatar: 'team/layla.png',
      })
      expect(server.calls('POST', '/uploads')[0].body.get('folder')).toBe('team')
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(await screen.findByText('Layla')).toBeInTheDocument()
      expect(await screen.findByText('Saved')).toBeInTheDocument()
      // the parent project was refetched, so the count on the tab follows
      await waitFor(() => expect(parentLoads()).toBeGreaterThan(before))
      await waitFor(() => expect(teamTab()).toHaveAccessibleName(/^Team\s*3$/))
      expect(server.calls('PUT', '/projects/7')).toHaveLength(0) // saving a member never submits the project form
    })

    it('maps a 422 onto the dialog fields and keeps it open', async () => {
      teamServer({ extra: { 'POST /projects/:id/team-members': () => validationError({ name: ['The name field is required.'], 'tasks_en.0': ['Too long.'] }) } })
      const { user } = await openTeam()
      await user.click(screen.getByRole('button', { name: 'Add member' }))
      const dialog = dialogOf('Add a team member')
      await enter(user, dialog.getByLabelText(/^Name/), 'Layla')
      await enter(user, dialog.getByLabelText('Role (Arabic)'), 'محللة')
      await enter(user, dialog.getByLabelText('Role (English)'), 'Analyst')

      await user.click(dialog.getByRole('button', { name: 'Save' }))

      expect(await dialog.findByText('The name field is required.')).toBeInTheDocument()
      expect(dialog.getByLabelText(/^Name/)).toHaveAttribute('aria-invalid', 'true')
      expect(dialog.getByText('Too long.')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(dialog.getByLabelText(/^Name/)).toHaveValue('Layla')
    })

    it('keeps the dialog open and toasts when the server fails', async () => {
      teamServer({ extra: { 'POST /projects/:id/team-members': () => reply(500, { message: 'boom' }) } })
      const { user } = await openTeam()
      await user.click(screen.getByRole('button', { name: 'Add member' }))
      const dialog = dialogOf('Add a team member')
      await enter(user, dialog.getByLabelText(/^Name/), 'Layla')
      await enter(user, dialog.getByLabelText('Role (Arabic)'), 'محللة')
      await enter(user, dialog.getByLabelText('Role (English)'), 'Analyst')

      await user.click(dialog.getByRole('button', { name: 'Save' }))

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('blocks Save while the avatar uploads', async () => {
      let release
      const gate = new Promise((resolve) => {
        release = resolve
      })
      teamServer({
        extra: {
          'POST /uploads': async () => {
            await gate
            return reply(201, { data: { path: 'team/a.png', url: 'http://localhost/media/team/a.png' } })
          },
        },
      })
      const { user } = await openTeam()
      await user.click(screen.getByRole('button', { name: 'Add member' }))
      const dialog = dialogOf('Add a team member')

      await user.upload(dialog.getByTestId('image-input'), png('a.png'))

      await waitFor(() => expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled())
      release()
      await waitFor(() => expect(dialog.getByRole('button', { name: 'Save' })).toBeEnabled())
    })
  })

  describe('edit', () => {
    it('opens the dialog filled with the member and saves the changes', async () => {
      const server = teamServer()
      const { user } = await openTeam()

      await user.click(screen.getByRole('button', { name: 'Edit: Sara' }))

      const dialog = dialogOf('Edit team member')
      expect(dialog.getByLabelText(/^Name/)).toHaveValue('Sara')
      expect(dialog.getByLabelText('Role (Arabic)')).toHaveValue('مطورة')
      expect(dialog.getByLabelText('Role (English)')).toHaveValue('Developer')
      expect(dialog.getByText('UI')).toBeInTheDocument() // task tags
      expect(dialog.getByText('Testing')).toBeInTheDocument()
      expect(dialog.getByText('واجهات')).toBeInTheDocument()
      expect(dialog.getByRole('img', { name: 'Image preview' })).toHaveAttribute('src', 'http://localhost/media/team/sara.png')

      await user.clear(dialog.getByLabelText(/^Name/))
      await enter(user, dialog.getByLabelText(/^Name/), 'Sara Ali')
      await user.click(dialog.getByRole('button', { name: 'Remove Testing' }))
      await user.click(dialog.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(server.calls('PUT', '/projects/7/team-members/1')).toHaveLength(1))
      expect(server.calls('PUT', '/projects/7/team-members/1')[0].body).toEqual({
        name: 'Sara Ali',
        role_ar: 'مطورة',
        role_en: 'Developer',
        tasks_ar: ['واجهات'],
        tasks_en: ['UI'],
        avatar: 'team/sara.png',
      })
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(await screen.findByText('Sara Ali')).toBeInTheDocument()
    })

    it('removes the avatar with null', async () => {
      const server = teamServer()
      const { user } = await openTeam()
      await user.click(screen.getByRole('button', { name: 'Edit: Sara' }))
      const dialog = dialogOf('Edit team member')

      await user.click(dialog.getByRole('button', { name: 'Remove image' }))
      await user.click(dialog.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(server.calls('PUT', '/projects/7/team-members/1')).toHaveLength(1))
      expect(server.calls('PUT', '/projects/7/team-members/1')[0].body.avatar).toBeNull()
    })

    it('starts from the right member every time the dialog opens', async () => {
      teamServer()
      const { user } = await openTeam()

      await user.click(screen.getByRole('button', { name: 'Edit: Sara' }))
      await enter(user, dialogOf('Edit team member').getByLabelText(/^Name/), ' (draft)')
      await user.click(dialogOf('Edit team member').getByRole('button', { name: 'Cancel' }))
      await user.click(screen.getByRole('button', { name: 'Edit: Omar' }))

      expect(dialogOf('Edit team member').getByLabelText(/^Name/)).toHaveValue('Omar')
      await user.click(dialogOf('Edit team member').getByRole('button', { name: 'Cancel' }))
      await user.click(screen.getByRole('button', { name: 'Add member' }))
      expect(dialogOf('Add a team member').getByLabelText(/^Name/)).toHaveValue('')
    })

    it('maps a 422 onto the fields', async () => {
      teamServer({ extra: { 'PUT /projects/:id/team-members/:memberId': () => validationError({ avatar: ['The avatar field format is invalid.'] }) } })
      const { user } = await openTeam()
      await user.click(screen.getByRole('button', { name: 'Edit: Sara' }))

      await user.click(dialogOf('Edit team member').getByRole('button', { name: 'Save' }))

      expect(await screen.findByText('The avatar field format is invalid.')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('delete', () => {
    it('asks first, then deletes the member and refreshes the list and the counts', async () => {
      const server = teamServer()
      const { user } = await openTeam()

      await user.click(screen.getByRole('button', { name: 'Delete: Omar' }))

      const dialog = screen.getByRole('dialog', { name: 'Delete team member' })
      expect(dialog).toHaveTextContent('Remove “Omar” from the project team?')
      expect(server.calls('DELETE')).toHaveLength(0)

      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(server.calls('DELETE', '/projects/7/team-members/2')).toHaveLength(1))
      await waitFor(() => expect(screen.queryByText('Omar')).not.toBeInTheDocument())
      expect(await screen.findByText('Deleted')).toBeInTheDocument()
      await waitFor(() => expect(teamTab()).toHaveAccessibleName(/^Team\s*1$/))
    })

    it('does nothing when cancelled', async () => {
      const server = teamServer()
      const { user } = await openTeam()

      await user.click(screen.getByRole('button', { name: 'Delete: Omar' }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(server.calls('DELETE')).toHaveLength(0)
      expect(screen.getByText('Omar')).toBeInTheDocument()
    })
  })

  describe('reorder', () => {
    it('reorders optimistically, saves the ids of the whole list and refreshes the parent', async () => {
      const server = teamServer()
      await openTeam()
      const before = server.calls('GET', '/projects/7').length

      dropOn(screen.getByRole('list', { name: 'Team members' }), 1, 2) // drop Sara on Omar

      await waitFor(() => expect(server.calls('POST', '/projects/7/team-members/reorder')).toHaveLength(1))
      expect(server.calls('POST', '/projects/7/team-members/reorder')[0].body).toEqual({ ids: [2, 1] })
      const names = () => within(screen.getByRole('list', { name: 'Team members' })).getAllByRole('listitem').map((item) => within(item).getByText(/^(Sara|Omar)$/).textContent)
      expect(names()).toEqual(['Omar', 'Sara'])
      expect(await screen.findByText('Order saved')).toBeInTheDocument()
      await waitFor(() => expect(server.calls('GET', '/projects/7').length).toBeGreaterThan(before))
      await waitFor(() => expect(names()).toEqual(['Omar', 'Sara'])) // and it stays that way after the refetch
    })

    it('puts the list back and toasts when saving the order fails', async () => {
      teamServer({ extra: { 'POST /projects/:id/team-members/reorder': () => reply(500, { message: 'boom' }) } })
      await openTeam()

      dropOn(screen.getByRole('list', { name: 'Team members' }), 1, 2)

      expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
      await waitFor(() => {
        const names = within(screen.getByRole('list', { name: 'Team members' })).getAllByRole('listitem').map((item) => within(item).getByText(/^(Sara|Omar)$/).textContent)
        expect(names).toEqual(['Sara', 'Omar'])
      })
    })
  })
})
