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

describe('partners feature contract', () => {
  it('keeps its id and navigation entry (the sidebar and the router depend on them)', () => {
    expect(feature.id).toBe('partners')
    expect(feature.nav).toMatchObject({ order: 70, group: 'content', to: '/partners', label: { ar: 'الشركاء', en: 'Partners' } })
    expect(feature.nav.icon).toBeTruthy()
    expect(feature.routes.map((route) => route.path)).toEqual(['partners', 'partners/new', 'partners/:id'])
  })

  it('routes /partners to the list, /partners/new to the create form and /partners/:id to the edit form', async () => {
    mockApi({
      'GET /partners': () => paginated([]),
      'GET /partners/:id': () => ({ data: { id: 5, name: 'Edit me', logo: null, logo_url: null, url: null, is_active: true } }),
    })

    const list = renderWithProviders(<Routed />, { route: '/partners' })
    expect(await screen.findByText('No partners yet')).toBeInTheDocument()
    list.unmount()

    const create = renderWithProviders(<Routed />, { route: '/partners/new' })
    expect(screen.getByRole('heading', { level: 1, name: 'Add a partner' })).toBeInTheDocument()
    create.unmount()

    renderWithProviders(<Routed />, { route: '/partners/5' })
    expect(await screen.findByDisplayValue('Edit me')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Edit partner' })).toBeInTheDocument()
  })
})
