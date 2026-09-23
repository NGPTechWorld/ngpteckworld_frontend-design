import { useEffect, useRef } from 'react'

/**
 * Feeds the pointer's position into `--mx` / `--my` on the element, which `.ngp-card::after` uses
 * to place its spotlight.
 *
 * Written straight to the style attribute instead of through React state: this fires on every
 * pointermove, and a re-render per mouse pixel would drop frames for a purely visual effect that
 * never needs to participate in reconciliation.
 *
 * Returns a ref to spread onto the card.
 */
export function useSpotlight() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Coarse pointers have no hover, so the listener would only ever cost work.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const onMove = (e) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const rect = el.getBoundingClientRect()
        el.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width) * 100 + '%')
        el.style.setProperty('--my', ((e.clientY - rect.top) / rect.height) * 100 + '%')
      })
    }
    const onLeave = () => {
      el.style.removeProperty('--mx')
      el.style.removeProperty('--my')
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return ref
}
