import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useListParams } from './useListParams'

const DEFAULTS = { per_page: 15, sort: 'order', dir: 'asc' }

function setup(initial = '/faqs') {
  const wrapper = ({ children }) => <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  return renderHook(
    () => {
      const list = useListParams(DEFAULTS)
      const location = useLocation()
      return { list, location }
    },
    { wrapper },
  )
}

describe('useListParams', () => {
  it('starts from the defaults', () => {
    const { result } = setup()
    expect(result.current.list.params).toEqual({ page: 1, per_page: 15, sort: 'order', dir: 'asc' })
    expect(result.current.list.hasFilters).toBe(false)
  })

  it('reads the URL (numbers stay numbers)', () => {
    const { result } = setup('/faqs?page=3&per_page=30&search=abc&is_active=0&sort=created_at&dir=desc')
    expect(result.current.list.params).toEqual({ page: 3, per_page: 30, sort: 'created_at', dir: 'desc', search: 'abc', is_active: '0' })
    expect(result.current.list.sort).toEqual({ key: 'created_at', dir: 'desc' })
    expect(result.current.list.hasFilters).toBe(true)
  })

  it('writes only non-default values to the URL and resets the page on a filter change', () => {
    const { result } = setup('/faqs?page=4')

    act(() => result.current.list.set({ search: 'hello', is_active: '1' }))

    expect(result.current.location.search).toBe('?search=hello&is_active=1')
    expect(result.current.list.params.page).toBe(1)

    act(() => result.current.list.set({ search: '' }))
    expect(result.current.location.search).toBe('?is_active=1')
  })

  it('setPage keeps other params; page 1 is not stored', () => {
    const { result } = setup('/faqs?search=x')
    act(() => result.current.list.setPage(2))
    expect(result.current.location.search).toBe('?search=x&page=2')
    act(() => result.current.list.setPage(1))
    expect(result.current.location.search).toBe('?search=x')
  })

  it('setSort takes the { key, dir } of DataTable; the default sort is not stored', () => {
    const { result } = setup()
    act(() => result.current.list.setSort({ key: 'created_at', dir: 'desc' }))
    expect(result.current.location.search).toBe('?sort=created_at&dir=desc')
    act(() => result.current.list.setSort({ key: 'order', dir: 'asc' }))
    expect(result.current.location.search).toBe('')
  })

  it('setPerPage and reset', () => {
    const { result } = setup('/faqs?search=x')
    act(() => result.current.list.setPerPage(50))
    expect(result.current.list.params.per_page).toBe(50)
    act(() => result.current.list.reset())
    expect(result.current.location.search).toBe('')
  })
})
