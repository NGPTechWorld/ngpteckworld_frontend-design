/** Returns the normalised URL only if it is a plain http(s) link — never javascript:, data:, etc. */
export function toHttpUrl(input) {
  try {
    const url = new URL(String(input ?? '').trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}
