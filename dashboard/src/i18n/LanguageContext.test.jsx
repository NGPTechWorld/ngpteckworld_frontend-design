import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LANG_KEY } from '@/lib/storage'
import { LanguageProvider, useLanguage } from './LanguageContext'
import { useCommon, useStrings } from './useStrings'

function Probe() {
  const { lang, isAr, dir, toggle, pick, pickField } = useLanguage()
  return (
    <div>
      <span data-testid="state">{`${lang}|${isAr}|${dir}`}</span>
      <span data-testid="pick">{pick('عربي', 'English')}</span>
      <span data-testid="pick-object">{pick({ ar: 'أ', en: 'E' })}</span>
      <span data-testid="field">{pickField({ title_ar: 'عنوان', title_en: 'Title' }, 'title')}</span>
      <button onClick={toggle}>toggle</button>
    </div>
  )
}

describe('LanguageContext', () => {
  it('defaults to Arabic / RTL and mirrors it on <html>', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('ar|true|rtl')
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    expect(screen.getByTestId('pick')).toHaveTextContent('عربي')
    expect(screen.getByTestId('pick-object')).toHaveTextContent('أ')
    expect(screen.getByTestId('field')).toHaveTextContent('عنوان')
  })

  it('toggle switches language, direction, <html> attributes and persists the choice', async () => {
    const user = userEvent.setup()
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'toggle' }))

    expect(screen.getByTestId('state')).toHaveTextContent('en|false|ltr')
    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
    expect(localStorage.getItem(LANG_KEY)).toBe('en')
    expect(screen.getByTestId('pick')).toHaveTextContent('English')
    expect(screen.getByTestId('field')).toHaveTextContent('Title')
  })

  it('restores the stored language, and ignores garbage', () => {
    localStorage.setItem(LANG_KEY, 'en')
    const { unmount } = render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('en|false|ltr')
    unmount()

    localStorage.setItem(LANG_KEY, 'fr')
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('ar|true|rtl')
  })

  it('initialLang wins over storage', () => {
    localStorage.setItem(LANG_KEY, 'ar')
    render(
      <LanguageProvider initialLang="en">
        <Probe />
      </LanguageProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('en|false|ltr')
  })

  it('pickField falls back to the other language when a value is empty', () => {
    const wrapper = ({ children }) => <LanguageProvider initialLang="en">{children}</LanguageProvider>
    const { result } = renderHook(() => useLanguage(), { wrapper })
    expect(result.current.pickField({ title_ar: 'عنوان', title_en: '' }, 'title')).toBe('عنوان')
    expect(result.current.pickField(null, 'title')).toBe('')
  })

  it('works without a provider (Arabic defaults)', () => {
    const { result } = renderHook(() => useLanguage())
    expect(result.current.lang).toBe('ar')
    expect(result.current.dir).toBe('rtl')
  })
})

describe('useStrings', () => {
  const strings = { ar: { hello: 'مرحبا', onlyAr: 'فقط' }, en: { hello: 'Hello', onlyEn: 'Only' } }

  it('returns the table of the current language and falls back to the other one', () => {
    const en = renderHook(() => useStrings(strings), { wrapper: ({ children }) => <LanguageProvider initialLang="en">{children}</LanguageProvider> })
    expect(en.result.current).toMatchObject({ hello: 'Hello', onlyEn: 'Only', onlyAr: 'فقط' })

    const ar = renderHook(() => useStrings(strings), { wrapper: ({ children }) => <LanguageProvider initialLang="ar">{children}</LanguageProvider> })
    expect(ar.result.current).toMatchObject({ hello: 'مرحبا', onlyAr: 'فقط', onlyEn: 'Only' })
  })

  it('useCommon ships every key in both languages', async () => {
    const { default: common } = await import('./common')
    expect(Object.keys(common.ar).sort()).toEqual(Object.keys(common.en).sort())
    const { result } = renderHook(() => useCommon(), { wrapper: ({ children }) => <LanguageProvider initialLang="en">{children}</LanguageProvider> })
    expect(result.current.save).toBe('Save')
    expect(result.current.paginationSummary(1, 15, 40)).toBe('Showing 1–15 of 40')
  })
})
