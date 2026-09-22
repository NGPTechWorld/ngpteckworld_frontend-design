import { fireEvent, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { Field } from './Field'
import { TagsInput } from './TagsInput'

function Harness({ initial = [], onChange, ...props }) {
  const [tags, setTags] = useState(initial)
  return (
    <TagsInput
      value={tags}
      onChange={(next) => {
        setTags(next)
        onChange?.(next)
      }}
      aria-label="Features"
      {...props}
    />
  )
}

describe('TagsInput', () => {
  it('adds a tag on Enter and clears the box', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness onChange={onChange} />)
    const input = screen.getByLabelText('Features')

    await user.type(input, 'Fast{Enter}')

    expect(onChange).toHaveBeenLastCalledWith(['Fast'])
    expect(screen.getByText('Fast')).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('adds on comma and on the Arabic comma, trims, and ignores empty text and duplicates', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness onChange={onChange} />)
    const input = screen.getByLabelText('Features')

    await user.type(input, '  one ,')
    await user.type(input, 'two،')
    await user.type(input, 'one{Enter}')
    await user.type(input, '   {Enter}')

    expect(onChange).toHaveBeenLastCalledWith(['one', 'two'])
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('adds the pending text when the box loses focus', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness onChange={onChange} />)

    await user.type(screen.getByLabelText('Features'), 'draft')
    await user.tab()

    expect(onChange).toHaveBeenLastCalledWith(['draft'])
  })

  it('splits pasted lists', async () => {
    const onChange = vi.fn()
    renderWithProviders(<Harness onChange={onChange} />)

    fireEvent.paste(screen.getByLabelText('Features'), { clipboardData: { getData: () => 'a, b\nc' } })

    expect(onChange).toHaveBeenLastCalledWith(['a', 'b', 'c'])
  })

  it('removes a tag with its button', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness initial={['a', 'b']} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Remove a' }))

    expect(onChange).toHaveBeenLastCalledWith(['b'])
    expect(screen.queryByText('a')).not.toBeInTheDocument()
  })

  it('Backspace on an empty box removes the last tag', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness initial={['a', 'b']} onChange={onChange} />)

    await user.type(screen.getByLabelText('Features'), '{Backspace}')

    expect(onChange).toHaveBeenLastCalledWith(['a'])
  })

  it('Enter never submits the surrounding form', async () => {
    const onSubmit = vi.fn((event) => event.preventDefault())
    const { user } = renderWithProviders(
      <form onSubmit={onSubmit}>
        <Harness />
      </form>,
    )
    await user.type(screen.getByLabelText('Features'), 'x{Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('respects max', async () => {
    const { user } = renderWithProviders(<Harness initial={['a']} max={2} />)
    const input = screen.getByLabelText('Features')

    await user.type(input, 'b{Enter}')

    expect(screen.getByText('b')).toBeInTheDocument()
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('placeholder', 'At most 2 items.')
  })

  it('sets the writing direction for the tags', () => {
    const { container } = renderWithProviders(<Harness initial={['سريع']} dir="rtl" />)
    expect(container.querySelector('[dir="rtl"]')).toHaveTextContent('سريع')
  })

  it('takes its id and error wiring from <Field>', () => {
    renderWithProviders(
      <Field label="Features" error="Too few">
        <TagsInput value={[]} onChange={() => {}} />
      </Field>,
    )
    expect(screen.getByLabelText('Features')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Features')).toHaveAccessibleDescription('Too few')
  })
})
