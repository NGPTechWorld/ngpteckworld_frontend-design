import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Reveal-on-scroll: content blocks fade/slide up as they enter the viewport,
// on every page, re-scanned on each route change.
export default function ScrollFX() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.documentElement.classList.add('fx-ready')
    let io
    const id = requestAnimationFrame(() => {
      // auto-tag each page's top-level blocks (skip the hero so it shows instantly)
      document
        .querySelectorAll('.view-enter > *:not([data-hero])')
        .forEach((el) => el.setAttribute('data-reveal', ''))
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
          })
        },
        { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
      )
      document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => io.observe(el))
    })
    return () => { cancelAnimationFrame(id); if (io) io.disconnect() }
  }, [pathname])

  return null
}
