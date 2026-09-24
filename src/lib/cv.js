// Helpers for the CV sections of a team member's page (entries shaped by the API's TeamProfileSections).

/** "2024-10" → "10/2024"; anything else → ''. */
export function formatMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value ?? ''))
  return match ? `${match[2]}/${match[1]}` : ''
}

/** "10/2022 – Present", "09/2019 – 10/2022", a single date, or '' when there is none. */
export function dateRange(start, end, current, presentLabel) {
  const from = formatMonth(start)
  const to = current ? presentLabel : formatMonth(end)
  if (from && to) return `${from} – ${to}`
  return from || to
}
