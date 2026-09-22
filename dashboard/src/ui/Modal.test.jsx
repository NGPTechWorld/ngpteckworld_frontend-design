import { screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { Button } from './Button'
import { Modal } from './Modal'

function Demo({ onClose = () => {}, closeOnBackdrop, footer }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(true)}>open</button>
      <Modal
        open={open}
        onClose={() => {
          onClose()
          setOpen(false)
        }}
        title="Edit link"
        description="Change the URL"
        closeOnBackdrop={closeOnBackdrop}
        footer={footer}
      >
        <input aria-label="url" />
        <button>inside</button>
      </Modal>
    </div>
  )
}

describe('Modal', () => {
  it('renders nothing while closed', () => {
    renderWithProviders(<Demo />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('is an accessible dialog: role, modal, title and description wiring', async () => {
    const { user } = renderWithProviders(<Demo />)
    await user.click(screen.getByText('open'))

    const dialog = screen.getByRole('dialog', { name: 'Edit link' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription('Change the URL')
  })

  it('moves focus inside, locks page scroll, and restores both on close', async () => {
    const { user } = renderWithProviders(<Demo />)
    const opener = screen.getByText('open')
    await user.click(opener)

    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus() // first focusable element
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })

  it('traps Tab inside the dialog in both directions', async () => {
    const { user } = renderWithProviders(<Demo />)
    await user.click(screen.getByText('open'))
    const close = screen.getByRole('button', { name: 'Close' })
    const inside = screen.getByRole('button', { name: 'inside' })

    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(inside).toHaveFocus() // wrapped from first to last
    await user.tab()
    expect(close).toHaveFocus() // wrapped from last to first
  })

  it('closes on Escape, on the close button and on a backdrop click', async () => {
    const onClose = vi.fn()
    const { user } = renderWithProviders(<Demo onClose={onClose} />)

    await user.click(screen.getByText('open'))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByText('open'))
    await user.click(screen.getByRole('dialog').parentElement)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('can ignore backdrop clicks', async () => {
    const onClose = vi.fn()
    const { user } = renderWithProviders(<Demo onClose={onClose} closeOnBackdrop={false} />)
    await user.click(screen.getByText('open'))
    await user.click(screen.getByRole('dialog').parentElement)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders the footer', async () => {
    const { user } = renderWithProviders(<Demo footer={<Button>Save link</Button>} />)
    await user.click(screen.getByText('open'))
    expect(screen.getByRole('button', { name: 'Save link' })).toBeInTheDocument()
  })

  it('only the topmost of stacked modals reacts to Escape', async () => {
    const outer = vi.fn()
    const inner = vi.fn()
    renderWithProviders(
      <>
        <Modal open onClose={outer} title="Outer">
          <p>outer body</p>
        </Modal>
        <Modal open onClose={inner} title="Inner">
          <p>inner body</p>
        </Modal>
      </>,
    )
    const user = (await import('@testing-library/user-event')).default.setup()

    await user.keyboard('{Escape}')

    expect(inner).toHaveBeenCalledTimes(1)
    expect(outer).not.toHaveBeenCalled()
  })
})
