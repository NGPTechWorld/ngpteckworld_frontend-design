import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '@/i18n'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ConfirmDialog, ConfirmProvider, useConfirm } from './ConfirmDialog'

function Asker({ options, onAnswer }) {
  const confirm = useConfirm()
  return <button onClick={async () => onAnswer(await confirm(options))}>ask</button>
}

describe('useConfirm', () => {
  it('resolves true when confirmed', async () => {
    const onAnswer = vi.fn()
    const { user } = renderWithProviders(<Asker onAnswer={onAnswer} options={{ title: 'Delete FAQ', message: 'Really?', confirmLabel: 'Yes, delete' }} />)

    await user.click(screen.getByText('ask'))
    const dialog = screen.getByRole('dialog', { name: 'Delete FAQ' })
    expect(dialog).toHaveTextContent('Really?')

    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(true))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('resolves false on cancel, Escape and backdrop click', async () => {
    const onAnswer = vi.fn()
    const { user } = renderWithProviders(<Asker onAnswer={onAnswer} options={{}} />)

    await user.click(screen.getByText('ask'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(onAnswer).toHaveBeenLastCalledWith(false))

    await user.click(screen.getByText('ask'))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(2))
    expect(onAnswer).toHaveBeenLastCalledWith(false)

    await user.click(screen.getByText('ask'))
    await user.click(screen.getByRole('dialog').parentElement) // the backdrop
    await waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(3))
    expect(onAnswer).toHaveBeenLastCalledWith(false)
  })

  it('uses sensible defaults (danger tone, "Delete") and focuses Cancel first', async () => {
    const { user } = renderWithProviders(<Asker onAnswer={() => {}} options={{}} />)

    await user.click(screen.getByText('ask'))

    expect(screen.getByRole('dialog', { name: 'Confirm deletion' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('supports a neutral tone with a "Confirm" default label', async () => {
    const { user } = renderWithProviders(<Asker onAnswer={() => {}} options={{ tone: 'primary', title: 'Publish?' }} />)
    await user.click(screen.getByText('ask'))
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('a newer question cancels the older one', async () => {
    const answers = []
    function Two() {
      const confirm = useConfirm()
      return (
        <button
          onClick={() => {
            confirm({ title: 'First' }).then((a) => answers.push(['first', a]))
            confirm({ title: 'Second' }).then((a) => answers.push(['second', a]))
          }}
        >
          both
        </button>
      )
    }
    const { user } = renderWithProviders(<Two />)
    await user.click(screen.getByText('both'))

    expect(screen.getByRole('dialog', { name: 'Second' })).toBeInTheDocument()
    await waitFor(() => expect(answers).toEqual([['first', false]]))
  })

  it('throws a helpful error outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Asker onAnswer={() => {}} options={{}} />)).toThrow(/ConfirmProvider/)
    spy.mockRestore()
  })

  it('is localized', async () => {
    const user = userEvent.setup()
    render(
      <LanguageProvider initialLang="ar">
        <ConfirmProvider>
          <Asker onAnswer={() => {}} options={{}} />
        </ConfirmProvider>
      </LanguageProvider>,
    )
    await user.click(screen.getByText('ask'))
    expect(screen.getByRole('dialog', { name: 'تأكيد الحذف' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'حذف' })).toBeInTheDocument()
  })
})

describe('ConfirmDialog (controlled)', () => {
  it('renders nothing when closed and calls the handlers when open', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <LanguageProvider initialLang="en">
        <ConfirmDialog open={false} onConfirm={onConfirm} onCancel={onCancel} />
      </LanguageProvider>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    rerender(
      <LanguageProvider initialLang="en">
        <ConfirmDialog open title="Sure?" message="This is final." onConfirm={onConfirm} onCancel={onCancel} loading={false} />
      </LanguageProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('disables the buttons while loading', () => {
    render(
      <LanguageProvider initialLang="en">
        <ConfirmDialog open loading onConfirm={() => {}} onCancel={() => {}} />
      </LanguageProvider>,
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Delete/ })).toBeDisabled()
  })
})
