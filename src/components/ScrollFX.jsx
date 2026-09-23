import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reveal-on-scroll, re-scanned on every route change *and* whenever new nodes appear.
 *
 * Two opt-ins:
 *   [data-reveal]  the original whole-block fade, auto-applied to each page's top-level sections
 *   [data-rise]    per-item entrance, staggered by `--i`
 *
 * A `[data-stagger]` parent numbers its own `[data-rise]` children, so a grid does not have to
 * hand-write an index onto every card.
 *
 * The MutationObserver is the important part. Most of what this page reveals — service cards,
 * projects, testimonials — is fetched, so it does not exist yet when the effect first runs. A
 * single scan at mount observed none of it, and because the CSS hides `[data-rise]` until the
 * observer adds `.in`, every card stayed at opacity 0 permanently: the page looked hung.
 *
 * Both attributes are gated behind the `.fx-ready` class this adds at runtime, so if the script
 * never runs the page still renders fully rather than staying invisible.
 */
export default function ScrollFX() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.documentElement.classList.add('fx-ready')

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('in')
          io.unobserve(e.target)
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' },
    )

    // `observed` guards against re-observing the same element on every mutation — unobserve()
    // only runs after an element has been revealed, so without this a chatty subtree would keep
    // re-registering the same nodes.
    const observed = new WeakSet()

    const scan = () => {
      // Auto-tag each page's top-level blocks (skip the hero, which animates on load instead).
      document.querySelectorAll('.view-enter > *:not([data-hero])').forEach((el) => {
        if (!el.hasAttribute('data-rise') && !el.hasAttribute('data-reveal')) {
          el.setAttribute('data-reveal', '')
        }
      })

      // Number the children of each stagger group.
      document.querySelectorAll('[data-stagger]').forEach((group) => {
        group.querySelectorAll(':scope > [data-rise]').forEach((el, i) => {
          el.style.setProperty('--i', String(i))
        })
      })

      document
        .querySelectorAll('[data-reveal]:not(.in), [data-rise]:not(.in)')
        .forEach((el) => {
          if (observed.has(el)) return
          observed.add(el)
          io.observe(el)
        })
    }

    let raf = requestAnimationFrame(scan)

    // Coalesce bursts of DOM changes into one scan per frame.
    let pending = 0
    const mo = new MutationObserver(() => {
      if (pending) return
      pending = requestAnimationFrame(() => { pending = 0; scan() })
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(pending)
      mo.disconnect()
      io.disconnect()
    }
  }, [pathname])

  return null
}
