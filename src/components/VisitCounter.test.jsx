import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VisitCounter from './VisitCounter'
import { LanguageProvider } from '../i18n/LanguageContext'
import { SiteSettingsProvider } from '../lib/SiteSettings'
import { api } from '../lib/api'

vi.mock('../lib/api', () => ({
  api: {
    recordVisit: vi.fn(),
    getSettings: vi.fn(),
    getContent: vi.fn(),
  },
}))

function show({ enabled = true, total = 1234 } = {}) {
  api.getSettings.mockResolvedValue({ visitor_counter_enabled: enabled })
  api.getContent?.mockResolvedValue?.(null)
  return render(
    <LanguageProvider>
      <SiteSettingsProvider>
        <VisitCounter />
      </SiteSettingsProvider>
    </LanguageProvider>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('the footer visit counter', () => {
  it('records the visit and shows the total it gets back', async () => {
    api.recordVisit.mockResolvedValue({ total: 1234 })
    show()

    expect(await screen.findByText('1,234')).toBeInTheDocument()
    expect(api.recordVisit).toHaveBeenCalledTimes(1)
  })

  it('records the visit even while the counter is switched off', async () => {
    // The whole point of recording regardless: the number is a real one on the day it is revealed.
    api.recordVisit.mockResolvedValue({ total: 11 })
    show({ enabled: false })

    await waitFor(() => expect(api.recordVisit).toHaveBeenCalled())
    expect(screen.queryByText('11')).not.toBeInTheDocument()
  })

  it('renders nothing rather than a zero while the request is in flight', () => {
    api.recordVisit.mockReturnValue(new Promise(() => {}))
    const { container } = show()

    expect(container).toBeEmptyDOMElement()
  })

  it('stays silent when the API is unreachable', async () => {
    api.recordVisit.mockRejectedValue(new Error('network down'))
    const { container } = show()

    await waitFor(() => expect(api.recordVisit).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('ignores a malformed answer instead of printing NaN', async () => {
    api.recordVisit.mockResolvedValue({ total: 'lots' })
    const { container } = show()

    await waitFor(() => expect(api.recordVisit).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('groups the digits', async () => {
    api.recordVisit.mockResolvedValue({ total: 1000000 })
    show()

    expect(await screen.findByText('1,000,000')).toBeInTheDocument()
  })
})
