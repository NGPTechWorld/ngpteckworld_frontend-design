import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, paginated } from '@/test/mockApi'
import { renderWithProviders, testUser } from '@/test/renderWithProviders'
import feature from './index'
import MyPortfolioPage from './MyPortfolioPage'

const profile = {
  id: 5, user_id: 1, slug: 'sara', is_active: true, order: 1,
  name_ar: 'سارة', name_en: 'Sara', job_title_ar: 'مطورة', job_title_en: 'Developer', bio_ar: 'نبذة', bio_en: 'Bio',
  avatar: null, avatar_url: null, email: null, phone: null, location_ar: null, location_en: null,
  department_ar: null, department_en: null, years_experience: null,
  skills: [{ title_ar: 'فلاتر', title_en: 'Flutter', description_ar: null, description_en: null }],
  experience: [], education: [], certifications: [], languages: [],
  social_links: [{ platform: 'github', url: 'https://github.com/sara', label: null }],
}

/** Behaves like the API: PUT /my-profile merges into the stored profile and answers with it. */
function myProfileServer() {
  let stored = { ...profile }
  return mockApi({
    'GET /my-profile': () => ({ data: stored }),
    'PUT /my-profile': ({ body }) => {
      stored = { ...stored, ...body }
      return { data: stored }
    },
    'GET /team/:id/portfolio': () => paginated([]),
  })
}

const linkedUser = { ...testUser, is_super_admin: false, role: 'admin', permissions: [], team_profile_id: 5 }

describe('my-portfolio feature contract', () => {
  it('keeps its id and navigation entry, with no section permission required', () => {
    expect(feature.id).toBe('my-portfolio')
    expect(feature.nav).toMatchObject({ order: 15, group: 'main', to: '/my-portfolio', label: { ar: 'بورتفوليو أعمالي', en: 'My Portfolio' } })
    expect(feature.routes.map((route) => route.path)).toEqual(['my-portfolio'])
  })
})

describe('MyPortfolioPage', () => {
  it('opens on the own profile, without the fields only team admins manage', async () => {
    myProfileServer()
    renderWithProviders(<MyPortfolioPage />, { authUser: linkedUser })

    expect(screen.getByRole('heading', { level: 1, name: 'My Portfolio' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Name (English)')).toHaveValue('Sara')
    expect(screen.getByLabelText('Skill (English)')).toHaveValue('Flutter')
    expect(screen.getByLabelText(/^URL/)).toHaveValue('https://github.com/sara')
    expect(screen.queryByLabelText('Slug')).not.toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: /Active/ })).not.toBeInTheDocument()
  })

  it('adds CV entries and saves them to /my-profile', async () => {
    const server = myProfileServer()
    const { user } = renderWithProviders(<MyPortfolioPage />, { authUser: linkedUser })
    await screen.findByLabelText('Name (English)')

    await user.click(screen.getByRole('button', { name: 'Add language' }))
    await user.type(screen.getByLabelText('Language (Arabic)'), 'الإنجليزية')
    await user.type(screen.getByLabelText('Language (English)'), 'English')
    await user.type(screen.getByLabelText('Level (English)'), 'B1')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('PUT', '/my-profile')).toHaveLength(1))
    const body = server.calls('PUT', '/my-profile')[0].body
    expect(body.languages).toEqual([{ name_ar: 'الإنجليزية', name_en: 'English', level_ar: null, level_en: 'B1' }])
    expect(body.skills).toEqual(profile.skills)
    expect(body).not.toHaveProperty('slug')
    expect(body).not.toHaveProperty('is_active')
    expect(body).not.toHaveProperty('user_id')
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('refuses to save an entry without its required fields', async () => {
    const server = myProfileServer()
    const { user } = renderWithProviders(<MyPortfolioPage />, { authUser: linkedUser })
    await screen.findByLabelText('Name (English)')

    await user.click(screen.getByRole('button', { name: 'Add education' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findAllByText('This field is required')).toHaveLength(2) // degree ar + en
    expect(server.calls('PUT', '/my-profile')).toHaveLength(0)
  })

  it('shows the own projects on the second tab', async () => {
    myProfileServer()
    const { user } = renderWithProviders(<MyPortfolioPage />, { authUser: linkedUser })
    await screen.findByLabelText('Name (English)')

    await user.click(screen.getByRole('tab', { name: 'My projects' }))

    expect(await screen.findByText('No projects yet')).toBeInTheDocument()
  })

  it('explains that no profile is linked yet, without calling the API', () => {
    const server = mockApi({})
    renderWithProviders(<MyPortfolioPage />, { authUser: { ...testUser, team_profile_id: null } })

    expect(screen.getByText(/No "Our Team" profile is linked/)).toBeInTheDocument()
    expect(server.requests).toHaveLength(0)
  })
})
