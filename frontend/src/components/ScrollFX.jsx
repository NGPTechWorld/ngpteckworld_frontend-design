import { useEffect, useRef } from 'react'

// Scroll effects:
// 1) reveal: fades/slides up any [data-reveal] element when it enters the viewport.
// 2) a decorative NGP mark in the background that drifts down + rotates as you
//    scroll, so the logo appears to travel from section to section.
export default function ScrollFX() {
  const markRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement

    // ----- reveal on scroll -----
    let io
    if (!reduce) {
      root.classList.add('fx-ready')
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in')
              io.unobserve(e.target)
            }
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
      )
      document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))
    }

    // ----- drifting / rotating background mark -----
    let raf = 0
    const onScroll = () => {
      if (raf || reduce) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const y = window.scrollY || 0
        const max = (document.documentElement.scrollHeight - window.innerHeight) || 1
        const p = Math.min(1, Math.max(0, y / max))
        const el = markRef.current
        if (el) {
          el.style.transform = `translateY(${y * 0.12}px) rotate(${p * 200}deg)`
          el.style.opacity = String(0.05 + p * 0.06)
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      if (io) io.disconnect()
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
      root.classList.remove('fx-ready')
    }
  }, [])

  return (
    <img
      ref={markRef}
      src="/assets/ngp-mark-white.png"
      alt=""
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: '14%',
        insetInlineEnd: '4%',
        width: 130,
        height: 'auto',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.05,
        filter: 'drop-shadow(0 0 30px rgba(201,168,106,.45))',
        willChange: 'transform, opacity',
      }}
    />
  )
}
