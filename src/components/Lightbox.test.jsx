import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Lightbox from './Lightbox'

test('shows the real photo when a src is given', () => {
  render(<Lightbox src="http://x.test/photo.jpg" bg="red" label="Image 1" onClose={() => {}} />)
  expect(screen.getByRole('img', { name: 'Image 1' })).toHaveAttribute('src', 'http://x.test/photo.jpg')
})

test('falls back to the placeholder label when there is no src', () => {
  render(<Lightbox src={null} bg="red" label="Image 1" onClose={() => {}} />)
  expect(screen.queryByRole('img')).toBeNull()
  expect(screen.getByText('Image 1')).toBeInTheDocument()
})

test('closes on click and on Escape', () => {
  const onClose = vi.fn()
  render(<Lightbox src={null} bg="red" label="Image 1" onClose={onClose} />)
  fireEvent.click(screen.getByRole('dialog'))
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalledTimes(2)
})
