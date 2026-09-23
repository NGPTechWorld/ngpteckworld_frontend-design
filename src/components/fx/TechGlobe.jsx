import { useEffect, useRef } from 'react'
import { landPoints } from '../../lib/worldMask'

/**
 * The rotating dot-globe behind the hero.
 *
 * Canvas rather than SVG or DOM: this paints a couple of thousand points every frame, and that
 * many elements in the DOM would spend all their time in layout and style recalculation instead.
 *
 * Everything is drawn in one orthographic projection — points on the far side of the sphere are
 * simply skipped, which is what makes it read as a solid body rather than a wireframe.
 *
 * ── Why the geometry is precomputed and flat ──────────────────────────────────
 * Only the *rotation* changes between frames; where a city sits, and the great-circle path
 * between two cities, never move. The first version recomputed every arc with a slerp per frame —
 * roughly 700 calls, each allocating a fresh array — which is a lot of garbage to make 60 times a
 * second, and it showed. Positions are now baked once into flat Float32Arrays and the per-frame
 * work is just the rotation matrix and the draw calls.
 */

/** Real coordinates, so the arcs land on the cities they claim to. [lon, lat] */
const CITIES = {
  damascus: [36.3, 33.5], dubai: [55.3, 25.2], riyadh: [46.7, 24.7], istanbul: [29.0, 41.0],
  cairo: [31.2, 30.0], london: [-0.1, 51.5], berlin: [13.4, 52.5], newYork: [-74.0, 40.7],
  saoPaulo: [-46.6, -23.5], lagos: [3.4, 6.5], mumbai: [72.8, 19.0], singapore: [103.8, 1.3],
  tokyo: [139.7, 35.7], sydney: [151.2, -33.9],
}

const ROUTES = [
  ['damascus', 'london'], ['damascus', 'dubai'], ['dubai', 'singapore'], ['istanbul', 'berlin'],
  ['cairo', 'lagos'], ['london', 'newYork'], ['newYork', 'saoPaulo'], ['mumbai', 'tokyo'],
  ['singapore', 'sydney'], ['riyadh', 'mumbai'], ['berlin', 'newYork'], ['tokyo', 'sydney'],
]

const TILT = (-20 * Math.PI) / 180
const ARC_STEPS = 40
const ARC_LIFT = 0.17

function toVec(lon, lat) {
  const phi = (lat * Math.PI) / 180
  const theta = (lon * Math.PI) / 180
  const c = Math.cos(phi)
  return [c * Math.sin(theta), Math.sin(phi), c * Math.cos(theta)]
}

/** Great-circle interpolation. Build-time only — never called from the render loop. */
function slerp(a, b, t) {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  dot = Math.max(-1, Math.min(1, dot))
  const omega = Math.acos(dot)
  if (omega < 1e-6) return a.slice()
  const s = Math.sin(omega)
  const k0 = Math.sin((1 - t) * omega) / s
  const k1 = Math.sin(t * omega) / s
  return [a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1]
}

/** Bake one route into a flat [x,y,z, x,y,z, …] buffer, already lifted off the surface. */
function bakeArc(from, to) {
  const out = new Float32Array((ARC_STEPS + 1) * 3)
  for (let i = 0; i <= ARC_STEPS; i++) {
    const k = i / ARC_STEPS
    const v = slerp(from, to, k)
    const lift = 1 + ARC_LIFT * Math.sin(Math.PI * k)
    out[i * 3] = v[0] * lift
    out[i * 3 + 1] = v[1] * lift
    out[i * 3 + 2] = v[2] * lift
  }
  return out
}

export default function TechGlobe({ className = '' }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Coarser grid on small screens: the sphere is physically smaller there, so the extra points
    // land on the same pixels and cost draw calls for nothing.
    const step = window.innerWidth < 720 ? 3.6 : 2.6
    const raw = landPoints(step)
    const dots = new Float32Array(raw.length * 3)
    for (let i = 0; i < raw.length; i++) {
      const v = toVec(raw[i][0], raw[i][1])
      dots[i * 3] = v[0]; dots[i * 3 + 1] = v[1]; dots[i * 3 + 2] = v[2]
    }
    const dotCount = raw.length

    const cityKeys = Object.keys(CITIES)
    const nodes = new Float32Array(cityKeys.length * 3)
    for (let i = 0; i < cityKeys.length; i++) {
      const v = toVec(CITIES[cityKeys[i]][0], CITIES[cityKeys[i]][1])
      nodes[i * 3] = v[0]; nodes[i * 3 + 1] = v[1]; nodes[i * 3 + 2] = v[2]
    }

    const arcs = ROUTES.map(([a, b], i) => ({
      points: bakeArc(toVec(...CITIES[a]), toVec(...CITIES[b])),
      offset: i / ROUTES.length,
      speed: 0.12 + (i % 4) * 0.02,
    }))

    const p = { x: 0, y: 0, tx: 0, ty: 0 }
    let width = 0, height = 0, radius = 0

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
      radius = Math.min(width, height) * 0.42
    }

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    let onScreen = true
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting }, { threshold: 0 })
    io.observe(wrap)

    const onPointer = (e) => {
      const rect = wrap.getBoundingClientRect()
      p.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      p.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    }
    // No pointer parallax on touch: there is no hovering cursor to follow, and the listener would
    // fire on every scroll-drag for nothing.
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!reduced && finePointer) window.addEventListener('pointermove', onPointer, { passive: true })

    let raf = 0
    let yaw = -1.9
    let last = performance.now()

    // Scratch values for the projection, reused every call instead of returning a new array.
    let sx = 0, sy = 0, sz = 0

    const render = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!reduced) yaw += dt * 0.075

      p.x += (p.tx - p.x) * 0.05
      p.y += (p.ty - p.y) * 0.05

      const cx = width / 2 + p.x * 14
      const cy = height / 2 + p.y * 10
      const tilt = TILT + p.y * 0.09
      const cosT = Math.cos(tilt), sinT = Math.sin(tilt)
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw)
      const t = now / 1000

      ctx.clearRect(0, 0, width, height)

      const project = (x, y, z) => {
        const x1 = x * cosY + z * sinY
        const z1 = -x * sinY + z * cosY
        const y2 = y * cosT - z1 * sinT
        sz = y * sinT + z1 * cosT
        sx = cx + x1 * radius
        sy = cy - y2 * radius
      }

      // Atmosphere.
      const halo = ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius * 1.45)
      halo.addColorStop(0, 'rgba(150,120,190,0.12)')
      halo.addColorStop(0.55, 'rgba(107,78,142,0.06)')
      halo.addColorStop(1, 'rgba(107,78,142,0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 1.45, 0, Math.PI * 2)
      ctx.fill()

      // Body: deliberately light. An opaque sphere turned the middle into a dark disc that the
      // logo then sat on like a sticker; keeping it near-transparent lets the backdrop through so
      // the dots read as the globe.
      const body = ctx.createRadialGradient(
        cx - radius * 0.35, cy - radius * 0.4, radius * 0.1, cx, cy, radius,
      )
      body.addColorStop(0, 'rgba(58,36,84,0.3)')
      body.addColorStop(1, 'rgba(18,10,28,0.42)')
      ctx.fillStyle = body
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      // Land. Batched into two paths by depth band so the whole field costs two fills rather
      // than one per point.
      ctx.fillStyle = '#8E6FB8'
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      for (let i = 0; i < dotCount; i++) {
        const o = i * 3
        project(dots[o], dots[o + 1], dots[o + 2])
        if (sz <= 0.02 || sz > 0.62) continue
        const r = 0.7 + sz * 0.8
        ctx.moveTo(sx + r, sy)
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
      }
      ctx.fill()

      ctx.fillStyle = '#C5B2E0'
      ctx.globalAlpha = 0.95
      ctx.beginPath()
      for (let i = 0; i < dotCount; i++) {
        const o = i * 3
        project(dots[o], dots[o + 1], dots[o + 2])
        if (sz <= 0.62) continue
        const r = 0.8 + sz * 1.05
        ctx.moveTo(sx + r, sy)
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
      }
      ctx.fill()
      ctx.globalAlpha = 1

      // Arcs. One path for every static trail, one for every pulse.
      ctx.lineCap = 'round'
      ctx.strokeStyle = 'rgba(180,150,220,0.24)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let a = 0; a < arcs.length; a++) {
        const pts = arcs[a].points
        let started = false
        for (let i = 0; i <= ARC_STEPS; i++) {
          const o = i * 3
          project(pts[o], pts[o + 1], pts[o + 2])
          if (sz <= 0) { started = false; continue }
          if (started) ctx.lineTo(sx, sy)
          else { ctx.moveTo(sx, sy); started = true }
        }
      }
      ctx.stroke()

      ctx.strokeStyle = 'rgba(226,210,246,0.85)'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      for (let a = 0; a < arcs.length; a++) {
        const arc = arcs[a]
        const head = (t * arc.speed + arc.offset) % 1
        const from = Math.max(0, Math.floor((head - 0.14) * ARC_STEPS))
        const to = Math.floor(head * ARC_STEPS)
        let started = false
        for (let i = from; i <= to; i++) {
          const o = i * 3
          project(arc.points[o], arc.points[o + 1], arc.points[o + 2])
          if (sz <= 0) { started = false; continue }
          if (started) ctx.lineTo(sx, sy)
          else { ctx.moveTo(sx, sy); started = true }
        }
      }
      ctx.stroke()

      // City nodes.
      for (let i = 0; i < cityKeys.length; i++) {
        const o = i * 3
        project(nodes[o], nodes[o + 1], nodes[o + 2])
        if (sz <= 0.04) continue
        const pulse = 0.6 + 0.4 * Math.sin(t * 2 + i * 1.7)
        ctx.globalAlpha = Math.min(1, sz * 1.3)
        ctx.fillStyle = 'rgba(232,220,250,0.95)'
        ctx.beginPath()
        ctx.arc(sx, sy, 1.8 + pulse * 0.8, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      ctx.strokeStyle = 'rgba(170,140,215,0.34)'
      ctx.lineWidth = 1.1
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.stroke()
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (onScreen) render(now)
      else last = now
    }

    if (reduced) render(performance.now())
    else raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])

  return (
    <div ref={wrapRef} className={'pointer-events-none relative ' + className} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}
