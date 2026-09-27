// Dates of the subscription a booking turns into. The API stores `accepted_at` (a day) and `duration_days`
// and answers with `expires_at` = accepted_at + duration_days; these helpers only do the same arithmetic on
// what the admin is still typing, and tell how far away the end is.

const DAY = 24 * 60 * 60 * 1000

/** "2026-09-27" → UTC midnight of that day (no timezone drift when adding days). */
const parseDay = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''))
  return match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null
}

const formatDay = (time) => new Date(time).toISOString().slice(0, 10)

/** Today as "YYYY-MM-DD" in the admin's own timezone. */
export function today(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** accepted_at + days as "YYYY-MM-DD", or null while either is missing / invalid. */
export function expiryOf(acceptedAt, days) {
  const start = parseDay(acceptedAt)
  const n = Number(days)
  if (start === null || !Number.isInteger(n) || n < 1) return null
  return formatDay(start + n * DAY)
}

/** Whole days from `from` (default today) to `to`: positive = left, 0 = ends today, negative = ended. */
export function daysUntil(to, from = today()) {
  const end = parseDay(to)
  const start = parseDay(from)
  return end === null || start === null ? null : Math.round((end - start) / DAY)
}
