import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, paginated } from '@/test/mockApi'
import { renderWithProviders, testUser } from '@/test/renderWithProviders'
import feature from './index'
import MyPortfolioPage from './MyPortfolioPage'

describe('my-portfolio feature contract', () => {
  it('keeps its id and navigation entry, with no section permission required', () => {
    expect(feature.id).toBe('my-portfolio')
    expect(feature.nav).toMatchObject({ order: 15, group: 'main', to: '/my-portfolio', label: { ar: 'بورتفوليو أعمالي', en: 'My Portfolio' } })
    expect(feature.routes.map((route) => route.path)).toEqual(['my-portfolio'])
  })
})

describe('MyPortfolioPage', () => {
  it("shows the signed-in admin's own portfolio when their account is linked to a profile", async () => {
    mockApi({ 'GET /team/:id/portfolio': () => paginated([]) })
    renderWithProviders(<MyPortfolioPage />, { authUser: { ...testUser, team_profile_id: 5 } })

    expect(screen.getByRole('heading', { level: 1, name: 'My Portfolio' })).toBeInTheDocument()
    expect(await screen.findByText('No portfolio items yet')).toBeInTheDocument()
  })

  it('explains that no profile is linked yet, without calling the portfolio endpoint', () => {
    const server = mockApi({})
    renderWithProviders(<MyPortfolioPage />, { authUser: { ...testUser, team_profile_id: null } })

    expect(screen.getByText(/No "Our Team" profile is linked/)).toBeInTheDocument()
    expect(server.requests).toHaveLength(0)
  })
})
