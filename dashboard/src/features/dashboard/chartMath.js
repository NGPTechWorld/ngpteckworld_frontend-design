/** 'YYYY-MM-DD' → a Date at local midnight (new Date('2026-09-01') would be UTC and can show the previous day). */
export function parseDay(value) {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

const STEPS = [1, 1.2, 1.6, 2, 3, 4, 5, 6, 8, 10]

/** Top of the y axis: a round, even number ≥ max (so the middle gridline is a whole number too). Never below 4. */
export function niceMax(max) {
  if (!Number.isFinite(max) || max <= 4) return 4
  const magnitude = 10 ** Math.floor(Math.log10(max))
  const top = STEPS.find((step) => step * magnitude >= max) * magnitude
  return Math.ceil(top / 2) * 2
}

/** { total, peak } — `peak` is the busiest day ({ date, count, index }) or null when nothing arrived. */
export function summarize(days) {
  let total = 0
  let peak = null
  days.forEach((day, index) => {
    total += day.count
    if (day.count > 0 && (!peak || day.count > peak.count)) peak = { ...day, index }
  })
  return { total, peak }
}

/** A column that is square at the baseline and rounded (radius `r`) at its data end. */
export function barPath({ x, width, top, base, radius }) {
  const r = Math.max(0, Math.min(radius, width / 2, base - top))
  return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + width - r} Q${x + width},${top} ${x + width},${top + r} V${base} Z`
}
