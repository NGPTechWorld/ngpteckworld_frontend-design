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

describe('testimonials feature contract', () => {
  it('keeps its id and navigation entry (the sidebar and the router depend on them)', () => {
    expect(feature.id).toBe('testimonials')
    expect(feature.nav).toMatchObject({ order: 60, group: 'content', to: '/testimonials', label: { ar: 'آراء العملاء', en: 'Testimonials' } })
    expect(feature.nav.icon).toBeTruthy()
    expect(feature.routes.map((route) => route.path)).toEqual(['testimonials', 'testimonials/new', 'testimonials/:id'])
  })

  it('routes /testimonials to the list, /testimonials/new to the create form and /testimonials/:id to the edit form', async () => {
    mockApi({
      'GET /testimonials': () => paginated([]),
      'GET /testimonials/:id': () => ({
        data: { id: 5, name: 'Edit me', company: null, quote_ar: 'ع', quote_en: 'Q', rating: 4, avatar: null, avatar_url: null, is_active: true },
      }),
    })

    const list = renderWithProviders(<Routed />, { route: '/testimonials' })
    expect(await screen.findByText('No testimonials yet')).toBeInTheDocument()
    list.unmount()

    const create = renderWithProviders(<Routed />, { route: '/testimonials/new' })
    expect(screen.getByRole('heading', { level: 1, name: 'Add a testimonial' })).toBeInTheDocument()
    create.unmount()

    renderWithProviders(<Routed />, { route: '/testimonials/5' })
    expect(await screen.findByDisplayValue('Edit me')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Edit testimonial' })).toBeInTheDocument()
  })
})
