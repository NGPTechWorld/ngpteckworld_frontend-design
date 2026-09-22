import { useState } from 'react'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { IconPicker } from './IconPicker'
import strings from './strings'

const labels = strings.en.icons

function Harness({ initial = '', onChange, error }) {
  const [value, setValue] = useState(initial)
  return (
    <IconPicker
      label="Icon"
      labels={labels}
      value={value}
      error={error}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

const selected = () => screen.getAllByRole('radio').find((radio) => radio.getAttribute('aria-checked') === 'true')

describe('IconPicker', () => {
  it('is a labelled radio group with one radio per icon, each showing its icon and name', () => {
    renderWithProviders(<Harness />)

    const group = screen.getByRole('radiogroup', { name: 'Icon' })
    expect(group).toBeInTheDocument()
    expect(screen.getAllByRole('radio').map((radio) => radio.textContent)).toEqual(['Web', 'Mobile', 'Design', 'ERP', 'Cloud', 'AI', 'Support'])
    screen.getAllByRole('radio').forEach((radio) => expect(radio.querySelector('svg')).not.toBeNull())
    expect(selected()).toBeUndefined()
  })

  it('selects on click and reports the key', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness onChange={onChange} />)

    await user.click(screen.getByRole('radio', { name: 'Design' }))

    expect(onChange).toHaveBeenCalledWith('design')
    expect(selected()).toHaveAccessibleName('Design')
  })

  it('has a single tab stop: the selected tile, or the first one when nothing is selected', () => {
    const { unmount } = renderWithProviders(<Harness />)
    expect(screen.getAllByRole('radio').filter((radio) => radio.tabIndex === 0)).toEqual([screen.getByRole('radio', { name: 'Web' })])
    unmount()

    renderWithProviders(<Harness initial="ai" />)
    expect(screen.getAllByRole('radio').filter((radio) => radio.tabIndex === 0)).toEqual([screen.getByRole('radio', { name: 'AI' })])
  })

  it('Right / Down move to the next tile and Left / Up to the previous one (left-to-right UI), wrapping around', async () => {
    const { user } = renderWithProviders(<Harness initial="web" />, { lang: 'en' })
    screen.getByRole('radio', { name: 'Web' }).focus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Mobile' })).toHaveFocus()
    expect(selected()).toHaveAccessibleName('Mobile')

    await user.keyboard('{ArrowDown}')
    expect(selected()).toHaveAccessibleName('Design')

    await user.keyboard('{ArrowLeft}{ArrowUp}')
    expect(selected()).toHaveAccessibleName('Web')

    await user.keyboard('{ArrowLeft}') // wraps to the last one
    expect(selected()).toHaveAccessibleName('Support')
    await user.keyboard('{ArrowRight}') // and back to the first
    expect(selected()).toHaveAccessibleName('Web')
  })

  it('mirrors Left / Right in the right-to-left UI so the focus follows the arrow visually', async () => {
    const { user } = renderWithProviders(<Harness initial="mobile" />, { lang: 'ar' })
    expect(document.documentElement.dir).toBe('rtl')
    screen.getByRole('radio', { name: 'Mobile' }).focus()

    await user.keyboard('{ArrowRight}') // in Arabic the first tile is on the right: Right = previous
    expect(selected()).toHaveAccessibleName('Web')

    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(selected()).toHaveAccessibleName('Design')
  })

  it('Home and End jump to the first and last tile', async () => {
    const { user } = renderWithProviders(<Harness initial="erp" />)
    screen.getByRole('radio', { name: 'ERP' }).focus()

    await user.keyboard('{End}')
    expect(selected()).toHaveAccessibleName('Support')
    await user.keyboard('{Home}')
    expect(selected()).toHaveAccessibleName('Web')
  })

  it('Space selects the focused tile', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness onChange={onChange} />)

    await user.tab() // first tile of an empty group
    expect(screen.getByRole('radio', { name: 'Web' })).toHaveFocus()
    await user.keyboard(' ')

    expect(onChange).toHaveBeenCalledWith('web')
  })

  it('shows the error and marks the group invalid', () => {
    renderWithProviders(<Harness error="Pick one" />)

    expect(screen.getByText('Pick one')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Icon' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('radiogroup', { name: 'Icon' })).toHaveAccessibleDescription('Pick one')
  })
})
