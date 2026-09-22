import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { formatDate } from '@/lib/format'
import { renderWithProviders } from '@/test/renderWithProviders'
import { RequestsChart } from './RequestsChart'
import { makeDays } from './testData'

const counts = Array.from({ length: 30 }, () => 0)
counts[3] = 2 // 26 Aug
counts[10] = 9 // 2 Sep — the busiest day
counts[29] = 1 // 21 Sep — today
const days = makeDays(counts)
const label = (date, options, lang = 'en') => formatDate(date, lang, options)

describe('RequestsChart', () => {
  it('summarises the period for screen readers and labels the total and the busiest day', () => {
    renderWithProviders(<RequestsChart days={days} />)

    const chart = screen.getByRole('img')
    expect(chart).toHaveAttribute('aria-label', expect.stringContaining('12 in total'))
    expect(chart).toHaveAttribute('aria-label', expect.stringContaining(`busiest day ${label(new Date(2026, 8, 2), { weekday: 'short', day: 'numeric', month: 'short' })} with 9`))
    expect(screen.getByText('Total for the period').nextSibling).toHaveTextContent('12')
    expect(screen.getByText('Busiest day').nextSibling).toHaveTextContent(`${label(new Date(2026, 8, 2), { day: 'numeric', month: 'short' })} · 9`)
  })

  it('shows a tooltip with the count and the date while a day is hovered', async () => {
    const { user } = renderWithProviders(<RequestsChart days={days} />)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.hover(screen.getByTestId('day-2026-09-02'))

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('9 requests')
    expect(tooltip).toHaveTextContent(label(new Date(2026, 8, 2), { weekday: 'short', day: 'numeric', month: 'short' }))

    await user.hover(screen.getByTestId('day-2026-09-21'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('1 request')
    expect(screen.getByRole('tooltip')).not.toHaveTextContent('1 requests')

    await user.unhover(screen.getByTestId('day-2026-09-21'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('also has a table view with every day, and can go back to the chart', async () => {
    const { user } = renderWithProviders(<RequestsChart days={days} />)

    await user.click(screen.getByRole('button', { name: 'View as table' }))

    const table = screen.getByRole('table', { name: 'Requests in the last 30 days' })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(31) // header + 30 days
    expect(within(rows[11]).getAllByRole('cell')[1]).toHaveTextContent('9')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'View as chart' }))
    expect(screen.getByRole('img')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('runs oldest → newest in reading direction: left to right in English, right to left in Arabic', () => {
    const { unmount } = renderWithProviders(<RequestsChart days={days} />, { lang: 'en' })
    expect(Number(screen.getByTestId('day-2026-08-23').getAttribute('x'))).toBe(0)
    expect(Number(screen.getByTestId('day-2026-09-21').getAttribute('x'))).toBe(290)
    unmount()

    renderWithProviders(<RequestsChart days={days} />, { lang: 'ar' })
    expect(Number(screen.getByTestId('day-2026-08-23').getAttribute('x'))).toBe(290)
    expect(Number(screen.getByTestId('day-2026-09-21').getAttribute('x'))).toBe(0)
  })

  it('draws a column only for days that have requests, taller for busier days', () => {
    renderWithProviders(<RequestsChart days={days} />)
    const bars = screen.getByRole('img').querySelectorAll('path')
    expect(bars).toHaveLength(3)
    const heights = [...bars].map((bar) => Number(/V(\d+(?:\.\d+)?) Q/.exec(bar.getAttribute('d'))[1]))
    expect(heights[1]).toBeLessThan(heights[0]) // the 9-request day reaches higher (smaller y) than the 2-request day
    expect(heights[1]).toBeLessThan(heights[2])
  })

  it('says so when nothing arrived (and keeps the scale)', () => {
    renderWithProviders(<RequestsChart days={makeDays(Array.from({ length: 30 }, () => 0))} />)

    expect(screen.getByText('No requests arrived in this period.')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringMatching(/^No requests between/))
    expect(screen.getByText('Busiest day').nextSibling).toHaveTextContent('—')
  })

  it('uses Arabic plurals in the tooltip', async () => {
    const { user } = renderWithProviders(<RequestsChart days={days} />, { lang: 'ar' })

    await user.hover(screen.getByTestId('day-2026-09-02'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('9 طلبات')
    await user.hover(screen.getByTestId('day-2026-08-26'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('طلبان')
    await user.hover(screen.getByTestId('day-2026-09-21'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('طلب واحد')
  })

  it('renders nothing without data', () => {
    renderWithProviders(<RequestsChart days={[]} />)
    expect(screen.queryByText('Requests in the last 30 days')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
