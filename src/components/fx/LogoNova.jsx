import { useEffect, useRef } from 'react'

/**
 * The hero centrepiece: the mark, with meteors streaming outward from behind it.
 *
 * Canvas for the meteors, DOM for the logo. The meteors are hundreds of moving trails — cheap on
 * a canvas, ruinous as elements — while the logo is a real <img> so it stays crisp at any DPR and
 * the browser can decode it off the main thread.
 *
 * Every particle lives in one flat Float32Array and is recycled on death rather than reallocated,
 * so the loop makes no garbage: per Motion's guidance, nothing inside a frame callback should
 * allocate.
 */

const COUNT_WIDE = 58
const COUNT_NARROW = 30
const STARS_WIDE = 54
const STARS_NARROW = 26

/**
 * Hexagonal pulses leaving the mark.
 *
 * A circular sweep was tried first and read as a radar screen — generic, and nothing to do with
 * this company. The mark is a hexagon, so the pulses are hexagons too, turning slightly as they
 * grow. That is what makes the animation belong to this brand rather than to any brand.
 */
const HEX_RINGS = 4
const HEX_CYCLE = 5.4   // seconds for one ring to travel out and vanish
const HEX_INNER = 0.2   // start radius as a fraction of `unit` — just clear of the mark
const HEX_OUTER = 0.56

const S_X = 0, S_Y = 1, S_R = 2, S_PHASE = 3, S_STRIDE = 4

// Slots per particle in the buffer.
const X = 0, Y = 1, VX = 2, VY = 3, LIFE = 4, MAX = 5, SIZE = 6, STRIDE = 7

/**
 * Comets that circle the mark. Radii are fractions of the visual's size; `tilt` rotates each
 * ellipse so the three orbits read as separate planes rather than concentric rings, and a
 * negative `speed` sends one round the other way, which is what stops the set looking like a
 * single rigid object spinning.
 */
const ORBITS = [
  { rx: 0.44, ry: 0.15, tilt: -0.38, speed: 0.62, size: 2.7, trail: 30, phase: 0 },
  { rx: 0.37, ry: 0.31, tilt: 0.92, speed: -0.46, size: 2.2, trail: 26, phase: 2.1 },
  { rx: 0.47, ry: 0.21, tilt: 0.28, speed: 0.34, size: 1.9, trail: 34, phase: 4.2 },
]

export default function LogoNova({ className = '' }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const narrow = window.innerWidth < 720
    const count = narrow ? COUNT_NARROW : COUNT_WIDE
    const p = new Float32Array(count * STRIDE)
    const starCount = narrow ? STARS_NARROW : STARS_WIDE
    const stars = new Float32Array(starCount * S_STRIDE)

    let width = 0, height = 0, cx = 0, cy = 0, unit = 0

    /** Launch one meteor from just outside the mark, heading outward. */
    const spawn = (i, stagger) => {
      const o = i * STRIDE
      const angle = Math.random() * Math.PI * 2
      // Start on a ring just outside the mark, so they read as leaving it rather than erupting
      // from a pinhole.
      const start = unit * (0.17 + Math.random() * 0.05)
      // Speed is derived from how far it should get, not picked independently. Chosen freely,
      // the fast ones left the visible area within a few frames of spawning and the field looked
      // empty however many particles were in it.
      const travel = unit * (0.2 + Math.random() * 0.18)
      const maxLife = 1.6 + Math.random() * 1.8
      const speed = travel / maxLife
      p[o + X] = cx + Math.cos(angle) * start
      p[o + Y] = cy + Math.sin(angle) * start
      p[o + VX] = Math.cos(angle) * speed
      p[o + VY] = Math.sin(angle) * speed
      p[o + MAX] = maxLife
      // Negative life on first fill spreads the initial burst over time instead of firing the
      // whole field on frame one.
      p[o + LIFE] = stagger ? -Math.random() * p[o + MAX] * 2 : 0
      p[o + SIZE] = 0.6 + Math.random() * 1.5
    }

    /** Scattered once per resize, biased outward so they sit around the mark, not under it. */
    const placeStars = () => {
      for (let i = 0; i < starCount; i++) {
        const o = i * S_STRIDE
        const a = Math.random() * Math.PI * 2
        const r = unit * (0.26 + Math.sqrt(Math.random()) * 0.28)
        stars[o + S_X] = cx + Math.cos(a) * r
        stars[o + S_Y] = cy + Math.sin(a) * r
        stars[o + S_R] = 0.5 + Math.random() * 1.1
        stars[o + S_PHASE] = Math.random() * Math.PI * 2
      }
    }

    /** Trace a hexagon of radius r, rotated by `rot`. */
    const hexPath = (r, rot) => {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = rot + (i * Math.PI) / 3
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
    }

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cx = width / 2
      cy = height / 2
      unit = Math.min(width, height)
      placeStars()
    }

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()
    for (let i = 0; i < count; i++) spawn(i, true)

    let onScreen = true
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting }, { threshold: 0 })
    io.observe(wrap)

    let raf = 0
    let last = performance.now()

    const render = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      ctx.clearRect(0, 0, width, height)
      // Everything is drawn additively, so overlapping light accumulates instead of occluding.
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      const t = now / 1000

      // ── Stars, for depth behind everything else ───────────────────────
      for (let i = 0; i < starCount; i++) {
        const o = i * S_STRIDE
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.3 + stars[o + S_PHASE]))
        ctx.fillStyle = 'rgba(206,188,240,' + (tw * 0.5).toFixed(3) + ')'
        ctx.beginPath()
        ctx.arc(stars[o + S_X], stars[o + S_Y], stars[o + S_R], 0, Math.PI * 2)
        ctx.fill()
      }

      // ── Hexagonal pulses ──────────────────────────────────────────────
      for (let i = 0; i < HEX_RINGS; i++) {
        // One shared cycle, offset per ring so they leave at even intervals.
        const k = ((t / HEX_CYCLE) + i / HEX_RINGS) % 1
        const r = unit * (HEX_INNER + (HEX_OUTER - HEX_INNER) * k)
        // In fast, out slow — a ring that appears at full strength pops.
        const alpha = Math.min(1, k * 8) * (1 - k) * (1 - k) * 0.55
        if (alpha <= 0.01) continue
        hexPath(r, k * 0.5) // the slow turn keeps successive rings from stacking into one shape
        ctx.strokeStyle = 'rgba(190,160,235,' + alpha.toFixed(3) + ')'
        ctx.lineWidth = 1.4 * (1 - k * 0.55)
        ctx.stroke()
      }

      const fade = unit * 0.5 // meteors are clipped to the visual's own circle

      for (let i = 0; i < count; i++) {
        const o = i * STRIDE
        p[o + LIFE] += dt
        const life = p[o + LIFE]
        if (life < 0) continue
        if (life > p[o + MAX]) { spawn(i, false); continue }

        p[o + X] += p[o + VX] * dt
        p[o + Y] += p[o + VY] * dt

        const dx = p[o + X] - cx
        const dy = p[o + Y] - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        // Never paint outside the visual's own circle.
        if (dist > fade) continue

        // Brightness follows the life, not the distance: a half-sine rises from nothing, peaks
        // mid-flight and returns to nothing, so every meteor is fully visible for most of its
        // run regardless of how fast it happens to be.
        const t = life / p[o + MAX]
        const alpha = Math.sin(Math.PI * t) * 0.95
        if (alpha <= 0.02) continue

        // The trail points back towards the centre, its length scaled by speed.
        const tail = 0.26
        const tx = p[o + X] - p[o + VX] * tail
        const ty = p[o + Y] - p[o + VY] * tail

        const grad = ctx.createLinearGradient(tx, ty, p[o + X], p[o + Y])
        grad.addColorStop(0, 'rgba(150,120,190,0)')
        grad.addColorStop(1, 'rgba(226,210,246,' + alpha.toFixed(3) + ')')
        ctx.strokeStyle = grad
        ctx.lineWidth = p[o + SIZE]
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(p[o + X], p[o + Y])
        ctx.stroke()

        // Bright head.
        ctx.fillStyle = 'rgba(240,232,255,' + (alpha * 0.9).toFixed(3) + ')'
        ctx.beginPath()
        ctx.arc(p[o + X], p[o + Y], p[o + SIZE] * 0.7, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── Orbiting comets ──────────────────────────────────────────────
      // Each is drawn as a run of dots trailing behind the head, fading and shrinking along the
      // way. Dots rather than a stroked curve: a gradient along an arc needs either a conic
      // gradient per frame or a stroke per segment, and both cost more than this does.
      for (let k = 0; k < ORBITS.length; k++) {
        const orb = ORBITS[k]
        const cosTilt = Math.cos(orb.tilt)
        const sinTilt = Math.sin(orb.tilt)
        const head = t * orb.speed + orb.phase
        const rx = orb.rx * unit
        const ry = orb.ry * unit

        for (let j = orb.trail; j >= 0; j--) {
          const a = head - j * 0.03 * Math.sign(orb.speed || 1)
          const ox = Math.cos(a) * rx
          const oy = Math.sin(a) * ry
          const x = cx + ox * cosTilt - oy * sinTilt
          const y = cy + ox * sinTilt + oy * cosTilt

          const f = 1 - j / (orb.trail + 1)
          // Dim the half of the orbit that passes behind the mark, so it reads as depth.
          const behind = Math.sin(a) < 0 ? 0.32 : 1
          const alpha = f * f * behind
          if (alpha <= 0.02) continue

          ctx.fillStyle = j === 0
            ? 'rgba(245,238,255,' + alpha.toFixed(3) + ')'
            : 'rgba(198,170,240,' + (alpha * 0.75).toFixed(3) + ')'
          ctx.beginPath()
          ctx.arc(x, y, orb.size * (0.3 + f * 0.7), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.globalCompositeOperation = 'source-over'
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (onScreen) render(now)
      else last = now
    }

    // Under reduced motion the meteors simply do not run; the logo and its rings carry the hero.
    if (!reduced) raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <div ref={wrapRef} className={'relative ' + className} aria-hidden="true">
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 block h-full w-full" />

      {/* Core bloom, so the meteors and pulses appear to leave a light source rather than an
          outline. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(160,128,205,.3), rgba(107,78,142,.1) 34%, transparent 62%)' }}
      />

      {/* The logo itself: the mark and the full lock-up crossfading on one shared cycle. Both are
          absolutely placed and centred so neither moves the other as they swap. */}
      <div className="ngp-logoswap">
        <img
          className="ngp-logoswap__mark"
          src="/assets/ngp-mark-white.png"
          alt=""
          width="436"
          height="476"
        />
        <img
          className="ngp-logoswap__full"
          src="/assets/ngp-logo-white.png"
          alt=""
          width="1582"
          height="539"
        />
      </div>
    </div>
  )
}
