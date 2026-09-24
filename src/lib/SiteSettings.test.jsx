import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { SectionGate, SiteSettingsProvider, useSections } from './SiteSettings'
import { api } from './api'

vi.mock('./api', () => ({ api: { getSettings: vi.fn() } }))

function Probe() {
  const shown = useSections()
  return (
    <div>
      <span data-testid="team">{String(shown('team'))}</span>
      <span data-testid="faq">{String(shown('faq'))}</span>
    </div>
  )
}

const renderProbe = () => render(<SiteSettingsProvider><Probe /></SiteSettingsProvider>)
const deferred = () => {
  let resolve
  const promise = new Promise((r) => { resolve = r })
  return { promise, resolve }
}

beforeEach(() => {
  localStorage.clear()
  api.getSettings.mockReset()
})

describe('SiteSettingsProvider sections', () => {
  it('never shows a switchable part before the settings are known (no flash of hidden sections)', async () => {
    const request = deferred()
    api.getSettings.mockReturnValue(request.promise)
    renderProbe()

    expect(screen.getByTestId('team')).toHaveTextContent('false')
    expect(screen.getByTestId('faq')).toHaveTextContent('false')

    request.resolve({ sections: { team: false } })
    await waitFor(() => expect(screen.getByTestId('faq')).toHaveTextContent('true'))
    expect(screen.getByTestId('team')).toHaveTextContent('false')
  })

  it('uses the settings of the previous visit on the first paint, then refreshes them', async () => {
    localStorage.setItem('ngp.settings', JSON.stringify({ sections: { team: false } }))
    const request = deferred()
    api.getSettings.mockReturnValue(request.promise)
    renderProbe()

    expect(screen.getByTestId('team')).toHaveTextContent('false')
    expect(screen.getByTestId('faq')).toHaveTextContent('true')

    request.resolve({ sections: { team: true, faq: false } })
    await waitFor(() => expect(screen.getByTestId('faq')).toHaveTextContent('false'))
    expect(screen.getByTestId('team')).toHaveTextContent('true')
    expect(JSON.parse(localStorage.getItem('ngp.settings'))).toEqual({ sections: { team: true, faq: false } })
  })

  it('shows everything when the API is down and nothing is cached', async () => {
    api.getSettings.mockRejectedValue(new Error('down'))
    renderProbe()

    await waitFor(() => expect(screen.getByTestId('team')).toHaveTextContent('true'))
  })

  it('SectionGate renders the fallback for a hidden page', async () => {
    api.getSettings.mockResolvedValue({ sections: { team: false } })
    render(
      <SiteSettingsProvider>
        <SectionGate section="team" fallback={<p>404</p>}><p>Team page</p></SectionGate>
        <SectionGate section="about" fallback={<p>404</p>}><p>About page</p></SectionGate>
      </SiteSettingsProvider>,
    )

    expect(await screen.findByText('About page')).toBeInTheDocument()
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.queryByText('Team page')).not.toBeInTheDocument()
  })
})
