import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, paginated } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import TeamList from './TeamList'

const makeMember = (id, over = {}) => ({
  id,
  slug: `member-${id}`,
  name_ar: `عضو ${id}`, name_en: `Member ${id}`,
  job_title_ar: 'مهندس', job_title_en: 'Engineer',
  bio_ar: 'نبذة', bio_en: 'Bio',
  avatar: null, avatar_url: null,
  email: null, phone: null,
  location_ar: null, location_en: null,
  department_ar: null, department_en: null,
  years_experience: null,
  skills_ar: [], skills_en: [], education_ar: [], education_en: [],
  experience_ar: [], experience_en: [], certifications_ar: [], certifications_en: [],
  languages_ar: [], languages_en: [],
  linkedin_url: null, github_url: null, website_url: null, twitter_url: null,
  is_active: true,
  order: id,
  created_at: '2026-09-01T10:00:00.000000Z',
  updated_at: '2026-09-01T10:00:00.000000Z',
  ...over,
})
const rows = [
  makeMember(1, { name_en: 'Sara Ahmad', job_title_en: 'Software Engineer' }),
  makeMember(2, { name_en: 'Omar Khaled', is_active: false }),
]

function listServer(extra = {}) {
  return mockApi({ 'GET /team': () => paginated(rows), ...extra })
}
const rowOf = (name) => screen.getByText(name).closest('tr')

describe('TeamList', () => {
  it('shows a skeleton first, then each member with their job title and active switch', async () => {
    const server = listServer()
    renderWithProviders(<TeamList />, { route: '/team' })

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Our Team' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New member' })).toHaveAttribute('href', '/team/new')

    expect(within(rowOf('Sara Ahmad')).getByRole('switch', { name: 'Active: Sara Ahmad' })).toHaveAttribute('aria-checked', 'true')
    expect(within(rowOf('Omar Khaled')).getByRole('switch', { name: 'Active: Omar Khaled' })).toHaveAttribute('aria-checked', 'false')
    expect(lastListQuery(server)).toEqual({ page: '1', per_page: '15', sort: 'order', dir: 'asc' })
  })

  it('searches and filters by status', async () => {
    const server = listServer()
    renderWithProviders(<TeamList />, { route: '/team' })
    await screen.findByText('Sara Ahmad')

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Omar' } })
    await waitFor(() => expect(lastListQuery(server).search).toBe('Omar'))

    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: '0' } })
    await waitFor(() => expect(lastListQuery(server).is_active).toBe('0'))
  })

  it('has an edit link and deletes a member after confirming', async () => {
    const server = listServer({ 'DELETE /team/:id': () => null })
    const { user } = renderWithProviders(<TeamList />, { route: '/team' })
    await screen.findByText('Sara Ahmad')

    expect(within(rowOf('Sara Ahmad')).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/team/1')

    await user.click(within(rowOf('Omar Khaled')).getByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete team member' })
    expect(dialog).toHaveTextContent('Delete "Omar Khaled" from the team?'.replace('"', '“').replace('"', '”'))
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(server.calls('DELETE', '/team/2')).toHaveLength(1))
  })

  it('explains that no member has been added yet', async () => {
    mockApi({ 'GET /team': () => paginated([]) })
    renderWithProviders(<TeamList />, { route: '/team' })

    expect(await screen.findByText('No team members yet')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'New member' }).length).toBeGreaterThan(0)
  })
})

function lastListQuery(server) {
  return server.calls('GET', '/team').at(-1).query
}
