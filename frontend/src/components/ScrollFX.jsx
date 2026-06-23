import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Scroll effects:
// 1) reveal: content blocks fade/slide up as they enter the viewport — on every
//    page, re-scanned on each route change.
// 2) a decorative NGP mark in the background that drifts DOWN, sways LEFT/RIGHT,
//    and rotates as you scroll, so the logo appears to travel between sections.
export default function ScrollFX() {
  const { pathname } = useLocation()
  const markRef = useRef(null)

  // --- drifting / swaying / rotating background mark (set up once) ---
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const y = window.scrollY || 0
      const max = (document.documentElement.scrollHeight - window.innerHeight) || 1
      const p = Math.min(1, Math.max(0, y / max))
      const el = markRef.current
      if (el) {
        const x = Math.sin(y / 300) * 40 // left / right sway
        el.style.transform = `translate(${x}px, ${y * 0.12}px) rotate(${p * 220}deg)`
        el.style.opacity = String(0.08 + p * 0.10)
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [])

  // --- reveal-on-scroll, re-scanned per route ---
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

  return (
    <img
      ref={markRef}
      src="/assets/ngp-mark-white.png"
      alt=""
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: '12%',
        insetInlineEnd: '5%',
        width: 130,
        height: 'auto',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.08,
        filter: 'drop-shadow(0 0 30px rgba(201,168,106,.5))',
        willChange: 'transform, opacity',
      }}
    />
  )
}
