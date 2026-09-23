import { screen } from '@testing-library/react'
import { useRoutes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { mockApi, paginated } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import feature from './index'

// the feature's routes exactly as the app router mounts them
function Routed() {
  return useRoutes(feature.routes.map((route) => ({ ...route, path: `/${route.path}` })))
}

const emptyLists = { skills_ar: [], skills_en: [], education_ar: [], education_en: [], experience_ar: [], experience_en: [], certifications_ar: [], certifications_en: [], languages_ar: [], languages_en: [] }

describe('team feature contract', () => {
  it('keeps its id and navigation entry (the sidebar and the router depend on them)', () => {
    expect(feature.id).toBe('team')
    expect(feature.nav).toMatchObject({ order: 75, group: 'content', to: '/team', label: { ar: 'فريقنا', en: 'Our Team' } })
    expect(feature.nav.icon).toBeTruthy()
    expect(feature.routes.map((route) => route.path)).toEqual(['team', 'team/new', 'team/:id'])
  })

  it('routes /team to the list, /team/new to the create form and /team/:id to the edit form', async () => {
    mockApi({
      'GET /team': () => paginated([]),
      'GET /team/:id': () => ({
        data: {
          id: 5, slug: 'edit-me', name_ar: 'ع', name_en: 'Edit me', job_title_ar: 'م', job_title_en: 'Engineer',
          bio_ar: 'ب', bio_en: 'Bio', avatar: null, avatar_url: null, email: null, phone: null,
          location_ar: null, location_en: null, department_ar: null, department_en: null, years_experience: null,
          linkedin_url: null, github_url: null, website_url: null, twitter_url: null, is_active: true, ...emptyLists,
        },
      }),
    })

    const list = renderWithProviders(<Routed />, { route: '/team' })
    expect(await screen.findByText('No team members yet')).toBeInTheDocument()
    list.unmount()

    const create = renderWithProviders(<Routed />, { route: '/team/new' })
    expect(screen.getByRole('heading', { level: 1, name: 'Add a team member' })).toBeInTheDocument()
    create.unmount()

    renderWithProviders(<Routed />, { route: '/team/5' })
    expect(await screen.findByDisplayValue('Edit me')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Edit team member' })).toBeInTheDocument()
  })
})
