import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { Pagination, pageWindow } from './Pagination'

const meta = (over = {}) => ({ current_page: 1, last_page: 5, per_page: 15, total: 72, from: 1, to: 15, ...over })

describe('pageWindow', () => {
  it('always keeps first, last and the neighbours; gaps of one page are filled', () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3])
    expect(pageWindow(1, 10)).toEqual([1, 2, '…', 10])
    expect(pageWindow(5, 10)).toEqual([1, '…', 4, 5, 6, '…', 10])
    expect(pageWindow(3, 10)).toEqual([1, 2, 3, 4, '…', 10])
    expect(pageWindow(10, 10)).toEqual([1, '…', 9, 10])
    expect(pageWindow(1, 1)).toEqual([1])
  })
})

describe('Pagination', () => {
  it('shows the range summary from the Laravel meta', () => {
    renderWithProviders(<Pagination meta={meta()} onPageChange={() => {}} />)
    expect(screen.getByText('Showing 1–15 of 72')).toBeInTheDocument()
  })

  it('derives from/to when the meta has none', () => {
    renderWithProviders(<Pagination meta={meta({ current_page: 2, from: undefined, to: undefined, total: 40 })} onPageChange={() => {}} />)
    expect(screen.getByText('Showing 16–30 of 40')).toBeInTheDocument()
  })

  it('marks the current page and goes to a page, next, previous, first and last', async () => {
    const onPageChange = vi.fn()
    const { user } = renderWithProviders(<Pagination meta={meta({ current_page: 3 })} onPageChange={onPageChange} />)

    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Page 4' }))
    expect(onPageChange).toHaveBeenLastCalledWith(4)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPageChange).toHaveBeenLastCalledWith(4)
    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(onPageChange).toHaveBeenLastCalledWith(2)
    await user.click(screen.getByRole('button', { name: 'First page' }))
    expect(onPageChange).toHaveBeenLastCalledWith(1)
    await user.click(screen.getByRole('button', { name: 'Last page' }))
    expect(onPageChange).toHaveBeenLastCalledWith(5)
  })

  it('disables previous/first on the first page and next/last on the last', () => {
    const { rerender } = renderWithProviders(<Pagination meta={meta()} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()

    rerender(<Pagination meta={meta({ current_page: 5 })} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled()
  })

  it('shows only the summary when there is a single page', () => {
    renderWithProviders(<Pagination meta={meta({ last_page: 1, total: 4, to: 4 })} onPageChange={() => {}} />)
    expect(screen.getByText('Showing 1–4 of 4')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
  })

  it('renders nothing without meta or without rows', () => {
    const { rerender } = renderWithProviders(<Pagination meta={null} onPageChange={() => {}} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    rerender(<Pagination meta={meta({ total: 0, last_page: 1, from: null, to: null })} onPageChange={() => {}} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('offers a per-page selector when asked', async () => {
    const onPerPageChange = vi.fn()
    const { user } = renderWithProviders(<Pagination meta={meta()} onPageChange={() => {}} onPerPageChange={onPerPageChange} perPageOptions={[15, 30]} />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Per page' }), '30')

    expect(onPerPageChange).toHaveBeenCalledWith(30)
  })

  it('jumps back to the last page when the requested page no longer exists', () => {
    const onPageChange = vi.fn()
    renderWithProviders(<Pagination meta={meta({ current_page: 4, last_page: 3, from: null, to: null })} onPageChange={onPageChange} />)
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('formats numbers and mirrors chevrons for Arabic', () => {
    renderWithProviders(<Pagination meta={meta({ total: 1200, to: 15 })} onPageChange={() => {}} />, { lang: 'ar' })
    expect(screen.getByText(/1[,٬]200/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'السابق' })).toBeInTheDocument()
  })
})
