import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageProvider, useLang } from './LanguageContext'

function Probe() {
  const { lang, dir, toggle, pick } = useLang()
  const obj = { name_ar: 'مرحبا', name_en: 'Hello' }
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="picked">{pick(obj, 'name')}</span>
      <button onClick={toggle}>t</button>
    </div>
  )
}

test('defaults to arabic rtl and toggles to english ltr', () => {
  render(<LanguageProvider><Probe /></LanguageProvider>)
  expect(screen.getByTestId('lang').textContent).toBe('ar')
  expect(screen.getByTestId('dir').textContent).toBe('rtl')
  expect(screen.getByTestId('picked').textContent).toBe('مرحبا')
  fireEvent.click(screen.getByText('t'))
  expect(screen.getByTestId('lang').textContent).toBe('en')
  expect(screen.getByTestId('dir').textContent).toBe('ltr')
  expect(screen.getByTestId('picked').textContent).toBe('Hello')
  expect(document.documentElement.dir).toBe('ltr')
})
