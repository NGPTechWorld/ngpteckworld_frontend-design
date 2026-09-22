import { toHttpUrl } from './url'

const youtube = (id) => (id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null)

/**
 * Turns a pasted YouTube / Vimeo link (watch, share, shorts…) into an embeddable player URL.
 * Returns null for any other link, so the caller can show a plain link instead of a broken iframe.
 */
export function toEmbedUrl(input) {
  const href = toHttpUrl(input)
  if (!href) return null

  const url = new URL(href)
  const host = url.hostname.replace(/^(www|m)\./, '')
  const segments = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') return youtube(segments[0])

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (segments[0] === 'watch') return youtube(url.searchParams.get('v'))
    if (['embed', 'shorts', 'live', 'v'].includes(segments[0])) return youtube(segments[1])
    return null
  }

  if (host === 'vimeo.com') {
    const id = segments.find((s) => /^\d+$/.test(s))
    return id ? `https://player.vimeo.com/video/${id}` : null
  }

  if (host === 'player.vimeo.com' && segments[0] === 'video' && /^\d+$/.test(segments[1] || '')) {
    return `https://player.vimeo.com/video/${segments[1]}`
  }

  return null
}
