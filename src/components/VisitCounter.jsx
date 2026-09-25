import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'
import { useSiteSettings } from '../lib/SiteSettings'

/**
 * The visit counter in the footer.
 *
 * The request is sent whether or not the counter is switched on, because it is what records the
 * visit; only the number is hidden. That way the count is a real one on the day the dashboard
 * reveals it, instead of starting from zero then.
 *
 * It renders nothing at all until it has a number. A footer that flashes a zero, or that shows a
 * skeleton where a count will be, draws the eye to exactly the thing a young site would rather
 * not have stared at.
 */
export default function VisitCounter() {
  const { t, lang } = useLang()
  const { visitor_counter_enabled: enabled } = useSiteSettings()
  const [total, setTotal] = useState(null)
  const sent = useRef(false)

  useEffect(() => {
    // StrictMode mounts every effect twice in development. The server would deduplicate the second
    // visit anyway, but there is no reason to send it.
    if (sent.current) return
    sent.current = true

    let alive = true
    api.recordVisit()
      .then((data) => {
        if (alive && Number.isFinite(data?.total)) setTotal(data.total)
      })
      // A counter is not worth a broken footer. Staying silent is the whole error handling.
      .catch(() => {})

    return () => { alive = false }
  }, [])

  if (!enabled || total === null) return null

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {t.footVisitors}
      {/* The digits stay Western in every language, Arabic included: the rest of the site writes
          numbers this way — the stats strip, the countdown — and one field in Eastern Arabic
          numerals among them reads as a mistake rather than a choice. */}
      <bdi className="font-mono text-[13px] text-soft" dir="ltr">
        {new Intl.NumberFormat(lang === 'ar' ? 'en' : lang).format(total)}
      </bdi>
    </span>
  )
}
