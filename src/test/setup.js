import '@testing-library/jest-dom'

// jsdom implements no media queries at all, so `window.matchMedia` is simply absent. Several
// components ask it whether to animate (prefers-reduced-motion) or whether the pointer supports
// hover, and without this they throw on mount — a gap in the test environment, not a defect in
// the components, so it is stubbed here rather than guarded at every call site.
//
// `matches: false` is the honest answer for a headless run: no reduced-motion preference is set,
// and there is no hover-capable pointer. Components take their normal path and skip the
// pointer-tracking effects that have nothing to assert against anyway.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    media: query,
    matches: false,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}
