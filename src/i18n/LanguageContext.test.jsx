import { render, screen, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { LanguageProvider, useLang } from './LanguageContext'

function Probe() {
  const { lang, dir, contentLang, setLang, pick, t } = useLang()
  const obj = { name_ar: 'مرحبا', name_en: 'Hello' }
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="contentLang">{contentLang}</span>
      <span data-testid="picked">{pick(obj, 'name')}</span>
      <span data-testid="nav">{t.navHome}</span>
      {['en', 'de', 'ru', 'zz'].map((code) => (
        <button key={code} onClick={() => setLang(code)}>{code}</button>
      ))}
    </div>
  )
}

const show = () => render(<LanguageProvider><Probe /></LanguageProvider>)

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.unstubAllGlobals()
  // unstubAllGlobals does not undo vi.spyOn: without this the storage test's throwing getItem
  // leaks into every test after it, and they silently fall through to browser detection.
  vi.restoreAllMocks()
})

test('starts in arabic, right to left, reading the arabic columns', () => {
  show()
  expect(screen.getByTestId('lang').textContent).toBe('ar')
  expect(screen.getByTestId('dir').textContent).toBe('rtl')
  expect(screen.getByTestId('picked').textContent).toBe('مرحبا')
  expect(document.documentElement.dir).toBe('rtl')
})

test('switches to english', () => {
  show()
  fireEvent.click(screen.getByText('en'))
  expect(screen.getByTestId('dir').textContent).toBe('ltr')
  expect(screen.getByTestId('picked').textContent).toBe('Hello')
  expect(screen.getByTestId('nav').textContent).toBe('Home')
})

test('a european language gets its own interface but the english records', () => {
  // The point of the whole split: German chrome, English content. Were `pick` to follow the
  // interface language it would look for `name_de`, find nothing, and blank every card.
  show()
  fireEvent.click(screen.getByText('de'))
  expect(screen.getByTestId('lang').textContent).toBe('de')
  expect(screen.getByTestId('dir').textContent).toBe('ltr')
  expect(screen.getByTestId('contentLang').textContent).toBe('en')
  expect(screen.getByTestId('nav').textContent).toBe('Startseite')
  expect(screen.getByTestId('picked').textContent).toBe('Hello')
})

test('sets the document language so the russian font rule can match on it', () => {
  show()
  fireEvent.click(screen.getByText('ru'))
  expect(document.documentElement.lang).toBe('ru')
  expect(screen.getByTestId('nav').textContent).toBe('Главная')
})

test('ignores a code it does not know rather than blanking the site', () => {
  show()
  fireEvent.click(screen.getByText('de'))
  fireEvent.click(screen.getByText('zz'))
  expect(screen.getByTestId('lang').textContent).toBe('de')
})

test('remembers the choice for the next visit', () => {
  const { unmount } = show()
  fireEvent.click(screen.getByText('de'))
  unmount()
  show()
  expect(screen.getByTestId('lang').textContent).toBe('de')
})

test('a survivable failure to read storage still renders the site', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked in a private window')
  })
  show()
  expect(screen.getByTestId('lang').textContent).toBe('ar')
})

test('greets a german browser in german', () => {
  vi.stubGlobal('navigator', { ...navigator, languages: ['de-AT', 'en-US'] })
  show()
  expect(screen.getByTestId('lang').textContent).toBe('de')
})

test('leaves an english browser on arabic, the site own language', () => {
  // Deliberate: an English-locale phone is ordinary among the company's Arabic-speaking audience.
  vi.stubGlobal('navigator', { ...navigator, languages: ['en-GB'] })
  show()
  expect(screen.getByTestId('lang').textContent).toBe('ar')
})

test('a remembered choice outranks the browser', () => {
  localStorage.setItem('ngp.lang', 'it')
  vi.stubGlobal('navigator', { ...navigator, languages: ['fr-FR'] })
  show()
  expect(screen.getByTestId('lang').textContent).toBe('it')
})
