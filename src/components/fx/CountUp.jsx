import { useEffect, useRef, useState } from 'react'

/**
 * Counts a stat up once it scrolls into view.
 *
 * Values arrive from the dashboard as free text ("240+", "8+", "12", "~30"), so the number is
 * located inside the string and the characters around it are preserved verbatim. Anything with no
 * digits at all is rendered untouched rather than guessed at.
 */
const NUMBER = /(\d[\d,.]*)/

export default function CountUp({ value, duration = 1600, className = '' }) {
  const text = String(value ?? '')
  const match = text.match(NUMBER)
  const ref = useRef(null)
  const [shown, setShown] = useState(null)

  const target = match ? Number(match[1].replace(/,/g, '')) : null
  const decimals = match && match[1].includes('.') ? match[1].split('.')[1].length : 0

  useEffect(() => {
    if (target === null || !Number.isFinite(target)) return
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(target)
      return
    }

    let raf = 0
    let started = false
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return
        started = true
        io.disconnect()
        const begin = performance.now()
        const step = (now) => {
          const p = Math.min((now - begin) / duration, 1)
          // easeOutExpo: most of the distance is covered early, so the number settles rather
          // than crawling the last few digits.
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
          setShown(target * eased)
          if (p < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [target, duration])

  if (target === null) return <span className={className}>{text}</span>

  const rendered = shown === null
    ? text.replace(NUMBER, (0).toFixed(decimals))
    : text.replace(NUMBER, shown.toFixed(decimals))

  return (
    <span ref={ref} className={className}>
      {rendered}
    </span>
  )
}
