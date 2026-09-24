import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { LanguageProvider, useLang } from '../i18n/LanguageContext'
import { ContentProvider, useContent } from './SiteContent'
import { ui } from '../i18n/ui'
import { api } from './api'
import ProcessSteps from '../components/ProcessSteps'
import About from '../pages/About'

vi.mock('./api', () => ({ api: { getContent: vi.fn() } }))

const content = {
  texts: {
    heroBadge: { ar: 'شارة من لوحة التحكم', en: 'Badge from the dashboard' },
    processTitle: { ar: 'عنوان جديد', en: '' },
    footRights: { ar: null, en: 'Custom rights' },
  },
  collections: {
    process_steps: [
      { id: 1, title_ar: 'خطوة أولى', title_en: 'First step', body_ar: 'وصف أول', body_en: 'First body', icon_key: null },
      { id: 2, title_ar: 'خطوة ثانية', title_en: 'Second step', body_ar: 'وصف ثان', body_en: 'Second body', icon_key: null },
    ],
    values: [
      { id: 3, title_ar: 'قيمة مخصصة', title_en: 'Custom value', body_ar: null, body_en: null, icon_key: 'innovation' },
    ],
    why_us: [],
  },
}

function Probe() {
  const { t, lang, setLang } = useLang()
  return (
    <div>
      <span data-testid="badge">{t.heroBadge}</span>
      <span data-testid="title">{t.processTitle}</span>
      <span data-testid="rights">{t.footRights}</span>
      <span data-testid="steps">{t.processSteps.map((s) => s.t).join('|')}</span>
      <span data-testid="whyus">{t.whyus.map((s) => s.t).join('|')}</span>
      <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>toggle</button>
      <button onClick={() => setLang('de')}>de</button>
    </div>
  )
}

const renderProbe = () =>
  render(
    <ContentProvider>
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    </ContentProvider>,
  )

const text = (id) => screen.getByTestId(id).textContent
const builtIn = (lang) => ({
  badge: ui[lang].heroBadge,
  title: ui[lang].processTitle,
  rights: ui[lang].footRights,
  steps: ui[lang].processSteps.map((s) => s.t).join('|'),
  whyus: ui[lang].whyus.map((s) => s.t).join('|'),
})
const snapshot = () => ({ badge: text('badge'), title: text('title'), rights: text('rights'), steps: text('steps'), whyus: text('whyus') })

// Lets a settled (rejected or empty) request run its handlers when nothing on screen changes.
const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)))

beforeEach(() => {
  // The chosen language is remembered now, so without this every test after the first one
  // that switches language would start in that language rather than in Arabic.
  localStorage.clear()
  api.getContent.mockReset()
})

describe('ContentProvider + LanguageProvider', () => {
  test('shows the built-in text first, then the dashboard content once it arrives', async () => {
    api.getContent.mockResolvedValue(content)
    renderProbe()
    expect(snapshot()).toEqual(builtIn('ar'))

    expect(await screen.findByText('شارة من لوحة التحكم')).toBeInTheDocument()
    expect(text('title')).toBe('عنوان جديد')
    expect(text('steps')).toBe('خطوة أولى|خطوة ثانية')
  })

  test('keeps the built-in text for what the dashboard left empty', async () => {
    api.getContent.mockResolvedValue(content)
    renderProbe()
    await screen.findByText('شارة من لوحة التحكم')
    // footRights is null in Arabic; why_us has no active item.
    expect(text('rights')).toBe(ui.ar.footRights)
    expect(text('whyus')).toBe(builtIn('ar').whyus)
  })

  test('toggling the language switches to the merged text of the other language', async () => {
    api.getContent.mockResolvedValue(content)
    renderProbe()
    await screen.findByText('شارة من لوحة التحكم')

    fireEvent.click(screen.getByText('toggle'))

    expect(text('badge')).toBe('Badge from the dashboard')
    expect(text('rights')).toBe('Custom rights')
    expect(text('steps')).toBe('First step|Second step')
    // processTitle is empty in English, so the built-in English title is used.
    expect(text('title')).toBe(ui.en.processTitle)

    fireEvent.click(screen.getByText('toggle'))
    expect(text('badge')).toBe('شارة من لوحة التحكم')
    expect(text('steps')).toBe('خطوة أولى|خطوة ثانية')
  })

  test('fetches the content only once, even across language changes', async () => {
    api.getContent.mockResolvedValue(content)
    renderProbe()
    await screen.findByText('شارة من لوحة التحكم')
    fireEvent.click(screen.getByText('toggle'))
    fireEvent.click(screen.getByText('toggle'))
    expect(api.getContent).toHaveBeenCalledTimes(1)
  })

  test('falls back to the built-in text when the request fails', async () => {
    api.getContent.mockRejectedValue(Object.assign(new Error('API 500'), { status: 500 }))
    renderProbe()
    await flush()

    expect(api.getContent).toHaveBeenCalledTimes(1)
    expect(snapshot()).toEqual(builtIn('ar'))
    fireEvent.click(screen.getByText('toggle'))
    expect(snapshot()).toEqual(builtIn('en'))
  })

  test.each([
    ['undefined (no data key)', undefined],
    ['null', null],
    ['an empty object', {}],
    ['a string', '<!doctype html>'],
    ['empty texts and collections', { texts: {}, collections: {} }],
    ['empty PHP arrays', { texts: [], collections: [] }],
  ])('behaves as today when the API answers with %s', async (_, data) => {
    api.getContent.mockResolvedValue(data)
    renderProbe()
    await flush()
    expect(snapshot()).toEqual(builtIn('ar'))
    fireEvent.click(screen.getByText('toggle'))
    expect(snapshot()).toEqual(builtIn('en'))
  })

  test('a malformed payload never breaks rendering', async () => {
    api.getContent.mockResolvedValue({ texts: 'x', collections: { process_steps: 'y', values: [null], why_us: [{ title_ar: 1 }] } })
    renderProbe()
    await flush()
    expect(snapshot()).toEqual(builtIn('ar'))
  })

  test('ignores a response that arrives after the provider was unmounted', async () => {
    let resolve
    api.getContent.mockReturnValue(new Promise((r) => { resolve = r }))
    const { unmount } = renderProbe()
    unmount()
    await act(async () => { resolve(content) })
    expect(api.getContent).toHaveBeenCalledTimes(1)
  })
  test('a european locale keeps its own dictionary and ignores the dashboard content', async () => {
    // End to end through the provider, not just mergeContent: German chrome must survive the
    // arrival of the dashboard payload rather than being overwritten with its English.
    api.getContent.mockResolvedValue(content)
    renderProbe()
    await screen.findByText('شارة من لوحة التحكم')

    fireEvent.click(screen.getByText('de'))

    expect(text('badge')).toBe(builtIn('de').badge)
    expect(text('badge')).not.toBe('Badge from the dashboard')
  })
})

describe('LanguageProvider without a ContentProvider', () => {
  test('serves the built-in dictionary and never calls the API', () => {
    render(<LanguageProvider><Probe /></LanguageProvider>)
    expect(snapshot()).toEqual(builtIn('ar'))
    fireEvent.click(screen.getByText('toggle'))
    expect(snapshot()).toEqual(builtIn('en'))
    expect(api.getContent).not.toHaveBeenCalled()
  })
})

describe('useContent', () => {
  function Raw() {
    const c = useContent()
    return <span data-testid="raw">{c === null ? 'null' : JSON.stringify(c)}</span>
  }

  test('is null without a provider', () => {
    render(<Raw />)
    expect(screen.getByTestId('raw')).toHaveTextContent('null')
  })

  test('is null until the content arrives, then the raw payload', async () => {
    api.getContent.mockResolvedValue(content)
    render(<ContentProvider><Raw /></ContentProvider>)
    expect(screen.getByTestId('raw')).toHaveTextContent('null')
    await waitFor(() => expect(screen.getByTestId('raw')).toHaveTextContent('"heroBadge"'))
    expect(JSON.parse(screen.getByTestId('raw').textContent)).toEqual(content)
  })

  test('stays null when the request fails', async () => {
    api.getContent.mockRejectedValue(new Error('down'))
    render(<ContentProvider><Raw /></ContentProvider>)
    await flush()
    expect(screen.getByTestId('raw')).toHaveTextContent('null')
  })
})

describe('existing components pick the content up unchanged', () => {
  test('the "How we work" section shows the dashboard steps and heading', async () => {
    api.getContent.mockResolvedValue(content)
    render(
      <ContentProvider>
        <LanguageProvider>
          <ProcessSteps />
        </LanguageProvider>
      </ContentProvider>,
    )
    expect(screen.getByText(ui.ar.processSteps[0].t)).toBeInTheDocument()

    expect(await screen.findByText('خطوة أولى')).toBeInTheDocument()
    expect(screen.getByText('وصف ثان')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'عنوان جديد' })).toBeInTheDocument()
    expect(screen.queryByText(ui.ar.processSteps[0].t)).toBeNull()
  })

  test('the About page renders the dashboard values and keeps the built-in "why us" when that list is empty', async () => {
    api.getContent.mockResolvedValue(content)
    render(
      <ContentProvider>
        <LanguageProvider>
          <About />
        </LanguageProvider>
      </ContentProvider>,
    )
    expect(await screen.findByText('قيمة مخصصة')).toBeInTheDocument()
    expect(screen.queryByText(ui.ar.values[0].t)).toBeNull()
    for (const w of ui.ar.whyus) expect(screen.getByText(w.t)).toBeInTheDocument()
  })
})
