import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { setUnauthorizedHandler } from '@/lib/api'

// jsdom gaps that the kit (dnd-kit, layout) touches
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })
}
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.HTMLElement.prototype.scrollIntoView ??= () => {}
URL.createObjectURL ??= () => 'blob:mock'
URL.revokeObjectURL ??= () => {}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
})

afterEach(() => {
  cleanup()
  setUnauthorizedHandler(null)
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  document.body.style.overflow = ''
})
