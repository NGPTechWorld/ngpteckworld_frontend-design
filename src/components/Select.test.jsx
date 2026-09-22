import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import Select from './Select'

const options = [
  { value: '1', label: 'Web design' },
  { value: '2', label: 'Mobile apps' },
  { value: '3', label: 'Cloud' },
]

function Controlled({ initial = '' }) {
  const [value, setValue] = useState(initial)
  return <Select id="svc" ariaLabel="Service" placeholder="Choose a service" value={value} onChange={setValue} options={options} />
}

describe('Select', () => {
  test('shows the placeholder when nothing is selected, and opens the list on click', () => {
    render(<Controlled />)
    const button = screen.getByRole('button', { name: 'Service' })
    expect(button).toHaveTextContent('Choose a service')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    fireEvent.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  test('clicking an option selects it and closes the list', () => {
    render(<Controlled />)
    fireEvent.click(screen.getByRole('button', { name: 'Service' }))

    fireEvent.click(screen.getByRole('option', { name: 'Mobile apps' }))

    expect(screen.getByRole('button', { name: 'Service' })).toHaveTextContent('Mobile apps')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  test('marks the currently selected option', () => {
    render(<Controlled initial="2" />)
    fireEvent.click(screen.getByRole('button', { name: 'Service' }))

    expect(screen.getByRole('option', { name: 'Mobile apps' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Web design' })).toHaveAttribute('aria-selected', 'false')
  })

  test('ArrowDown moves the active option and Enter selects it', () => {
    render(<Controlled />)
    fireEvent.click(screen.getByRole('button', { name: 'Service' }))
    const list = screen.getByRole('listbox')

    fireEvent.keyDown(list, { key: 'ArrowDown' })
    fireEvent.keyDown(list, { key: 'ArrowDown' })
    fireEvent.keyDown(list, { key: 'Enter' })

    expect(screen.getByRole('button', { name: 'Service' })).toHaveTextContent('Cloud')
  })

  test('Escape closes the list without changing the selection', () => {
    render(<Controlled initial="1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Service' }))

    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Service' })).toHaveTextContent('Web design')
  })

  test('clicking outside closes the list without changing the selection', () => {
    render(
      <div>
        <Controlled initial="1" />
        <button>Outside</button>
      </div>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Service' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }))

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Service' })).toHaveTextContent('Web design')
  })

  test('ArrowDown on the closed button opens the list', () => {
    render(<Controlled />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Service' }), { key: 'ArrowDown' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  test('flags invalid state for assistive tech', () => {
    render(<Select id="svc" ariaLabel="Service" placeholder="Choose" value="" onChange={() => {}} options={options} invalid describedBy="svc-error" />)
    const button = screen.getByRole('button', { name: 'Service' })
    expect(button).toHaveAttribute('aria-invalid', 'true')
    expect(button).toHaveAttribute('aria-describedby', 'svc-error')
  })
})
