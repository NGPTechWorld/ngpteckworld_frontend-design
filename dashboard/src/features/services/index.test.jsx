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

describe('services feature contract', () => {
  it('keeps its id and navigation entry (the sidebar and the router depend on them)', () => {
    expect(feature.id).toBe('services')
    expect(feature.nav).toMatchObject({ order: 40, group: 'content', to: '/services', label: { ar: 'الخدمات', en: 'Services' } })
    expect(feature.nav.icon).toBeTruthy()
    expect(feature.routes.map((route) => route.path)).toEqual(['services', 'services/new', 'services/:id'])
  })

  it('routes /services to the list, /services/new to the create form and /services/:id to the edit form', async () => {
    mockApi({
      'GET /services': () => paginated([]),
      'GET /services/:id': () => ({ data: { id: 5, icon_key: 'web', title_ar: 'ع', title_en: 'Edit me', description_ar: 'و', description_en: 'D', features_ar: [], features_en: [] } }),
    })

    const list = renderWithProviders(<Routed />, { route: '/services' })
    expect(await screen.findByText('No services yet')).toBeInTheDocument()
    list.unmount()

    const create = renderWithProviders(<Routed />, { route: '/services/new' })
    expect(screen.getByRole('heading', { level: 1, name: 'Add a service' })).toBeInTheDocument()
    create.unmount()

    renderWithProviders(<Routed />, { route: '/services/5' })
    expect(await screen.findByDisplayValue('Edit me')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Edit service' })).toBeInTheDocument()
  })
})
