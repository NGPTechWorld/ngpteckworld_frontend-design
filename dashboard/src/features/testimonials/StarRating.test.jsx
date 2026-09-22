import { useState } from 'react'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { StarRatingInput, Stars } from './StarRating'

function Harness({ initial = 0, onChange, error }) {
  const [value, setValue] = useState(initial)
  return (
    <StarRatingInput
      label="Rating"
      value={value}
      error={error}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

const checked = () => screen.getAllByRole('radio').find((radio) => radio.getAttribute('aria-checked') === 'true')

describe('Stars (read-only)', () => {
  it('describes the rating to assistive technology in both languages', () => {
    const { unmount } = renderWithProviders(<Stars value={3} />)
    expect(screen.getByRole('img', { name: '3 out of 5 stars' })).toBeInTheDocument()
    unmount()

    renderWithProviders(<Stars value={1} />, { lang: 'ar' })
    expect(screen.getByRole('img', { name: 'نجمة واحدة من 5' })).toBeInTheDocument()
  })

  it('draws five stars and fills as many as the value', () => {
    renderWithProviders(<Stars value={2} />)
    const stars = screen.getByRole('img').querySelectorAll('svg')
    expect(stars).toHaveLength(5)
    expect([...stars].map((star) => star.classList.contains('fill-gold'))).toEqual([true, true, false, false, false])
  })
})

describe('StarRatingInput', () => {
  it('is a labelled radio group of five stars, each with a text name, showing the current value', () => {
    renderWithProviders(<Harness initial={4} />)

    expect(screen.getByRole('radiogroup', { name: 'Rating' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('aria-label'))).toEqual(['1 star', '2 stars', '3 stars', '4 stars', '5 stars'])
    expect(checked()).toHaveAccessibleName('4 stars')
    expect(screen.getByText('4 / 5')).toBeInTheDocument()
  })

  it('chooses a star on click and reports it', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness onChange={onChange} />)
    expect(checked()).toBeUndefined()

    await user.click(screen.getByRole('radio', { name: '3 stars' }))

    expect(onChange).toHaveBeenCalledWith(3)
    expect(checked()).toHaveAccessibleName('3 stars')
  })

  it('has one tab stop: the chosen star, or the first one when nothing is chosen', () => {
    const { unmount } = renderWithProviders(<Harness />)
    expect(screen.getAllByRole('radio').filter((radio) => radio.tabIndex === 0)).toEqual([screen.getByRole('radio', { name: '1 star' })])
    unmount()

    renderWithProviders(<Harness initial={4} />)
    expect(screen.getAllByRole('radio').filter((radio) => radio.tabIndex === 0)).toEqual([screen.getByRole('radio', { name: '4 stars' })])
  })

  it('Right / Down give more stars and Left / Up fewer in the left-to-right UI, stopping at the ends', async () => {
    const { user } = renderWithProviders(<Harness initial={3} />, { lang: 'en' })
    screen.getByRole('radio', { name: '3 stars' }).focus()

    await user.keyboard('{ArrowRight}')
    expect(checked()).toHaveAccessibleName('4 stars')
    expect(screen.getByRole('radio', { name: '4 stars' })).toHaveFocus() // focus follows the choice

    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}') // 5, then it stops
    expect(checked()).toHaveAccessibleName('5 stars')

    await user.keyboard('{ArrowLeft}{ArrowUp}')
    expect(checked()).toHaveAccessibleName('3 stars')

    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}')
    expect(checked()).toHaveAccessibleName('1 star')
  })

  it('mirrors Left / Right in the right-to-left UI: the first star is on the right, so Right means fewer', async () => {
    const { user } = renderWithProviders(<Harness initial={3} />, { lang: 'ar' })
    expect(document.documentElement.dir).toBe('rtl')
    screen.getByRole('radio', { name: '3 نجوم' }).focus()

    await user.keyboard('{ArrowRight}')
    expect(checked()).toHaveAccessibleName('نجمتان')

    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(checked()).toHaveAccessibleName('4 نجوم')
  })

  it('Home and End jump to 1 and 5', async () => {
    const { user } = renderWithProviders(<Harness initial={3} />)
    screen.getByRole('radio', { name: '3 stars' }).focus()

    await user.keyboard('{End}')
    expect(checked()).toHaveAccessibleName('5 stars')
    await user.keyboard('{Home}')
    expect(checked()).toHaveAccessibleName('1 star')
  })

  it('Space chooses the focused star when nothing was chosen yet', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness onChange={onChange} />)

    await user.tab()
    expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus()
    await user.keyboard(' ')

    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('shows the error and marks the group invalid', () => {
    renderWithProviders(<Harness error="Pick a rating" />)

    expect(screen.getByText('Pick a rating')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Rating' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('radiogroup', { name: 'Rating' })).toHaveAccessibleDescription('Pick a rating')
  })
})
