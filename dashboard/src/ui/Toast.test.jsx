import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '@/i18n'
import { ToastProvider, useToast } from './Toast'

function Demo() {
  const toast = useToast()
  return (
    <div>
      <button onClick={() => toast.success('Saved!')}>ok</button>
      <button onClick={() => toast.error('Broke')}>err</button>
      <button onClick={() => toast.show({ type: 'info', message: 'Sticky', duration: 0 })}>sticky</button>
      <button onClick={() => [1, 2, 3, 4, 5, 6].forEach((n) => toast.info(`n${n}`))}>many</button>
    </div>
  )
}

const setup = () =>
  render(
    <LanguageProvider initialLang="en">
      <ToastProvider>
        <Demo />
      </ToastProvider>
    </LanguageProvider>,
  )

afterEach(() => vi.useRealTimers())

describe('Toast', () => {
  it('shows a status toast for success and an alert for errors', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByText('ok'))
    expect(screen.getByRole('status')).toHaveTextContent('Saved!')

    await user.click(screen.getByText('err'))
    expect(screen.getByRole('alert')).toHaveTextContent('Broke')
  })

  it('can be dismissed with its close button', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('sticky'))

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByText('Sticky')).not.toBeInTheDocument()
  })

  it('disappears by itself (errors stay longer than successes)', () => {
    vi.useFakeTimers()
    setup()
    act(() => screen.getByText('ok').click())
    act(() => screen.getByText('err').click())
    expect(screen.getByText('Saved!')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(4100))
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument()
    expect(screen.getByText('Broke')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(3000))
    expect(screen.queryByText('Broke')).not.toBeInTheDocument()
  })

  it('duration 0 keeps the toast until dismissed', () => {
    vi.useFakeTimers()
    setup()
    act(() => screen.getByText('sticky').click())
    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByText('Sticky')).toBeInTheDocument()
  })

  it('keeps at most four toasts on screen', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('many'))
    expect(screen.queryByText('n1')).not.toBeInTheDocument()
    expect(screen.queryByText('n2')).not.toBeInTheDocument()
    expect(screen.getByText('n6')).toBeInTheDocument()
    expect(screen.getAllByRole('status')).toHaveLength(4)
  })

  it('exposes a stable api object', () => {
    const seen = new Set()
    function Probe() {
      seen.add(useToast())
      return null
    }
    const { rerender } = render(
      <LanguageProvider initialLang="en">
        <ToastProvider>
          <Probe />
        </ToastProvider>
      </LanguageProvider>,
    )
    rerender(
      <LanguageProvider initialLang="en">
        <ToastProvider>
          <Probe />
        </ToastProvider>
      </LanguageProvider>,
    )
    expect(seen.size).toBe(1)
  })

  it('throws a helpful error outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Demo />)).toThrow(/ToastProvider/)
    spy.mockRestore()
  })
})
