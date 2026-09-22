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

describe('stats feature contract', () => {
  it('keeps its id and navigation entry (the sidebar and the router depend on them)', () => {
    expect(feature.id).toBe('stats')
    expect(feature.nav).toMatchObject({ order: 50, group: 'content', to: '/stats', label: { ar: 'الإحصائيات', en: 'Stats' } })
    expect(feature.nav.icon).toBeTruthy()
    expect(feature.routes.map((route) => route.path)).toEqual(['stats', 'stats/new', 'stats/:id'])
  })

  it('routes /stats to the list, /stats/new to the create form and /stats/:id to the edit form', async () => {
    mockApi({
      'GET /stats': () => paginated([]),
      'GET /stats/:id': () => ({ data: { id: 5, value: '77+', label_ar: 'ع', label_en: 'Edit me' } }),
    })

    const list = renderWithProviders(<Routed />, { route: '/stats' })
    expect(await screen.findByText('No stats yet')).toBeInTheDocument()
    list.unmount()

    const create = renderWithProviders(<Routed />, { route: '/stats/new' })
    expect(screen.getByRole('heading', { level: 1, name: 'Add a stat' })).toBeInTheDocument()
    create.unmount()

    renderWithProviders(<Routed />, { route: '/stats/5' })
    expect(await screen.findByDisplayValue('Edit me')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Edit stat' })).toBeInTheDocument()
  })
})
