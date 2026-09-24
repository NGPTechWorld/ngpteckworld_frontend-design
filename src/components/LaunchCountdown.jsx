import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../i18n/LanguageContext'
import LogoNova from './fx/LogoNova'
import LanguageMenu from './LanguageMenu'

/**
 * The pre-launch screen, shown instead of the site while the dashboard's countdown is running.
 *
 * It lifts itself. The server says whether the gate is on and when it ends; this ticks against
 * that moment and swaps to the real site the second it passes, so nobody has to be at a keyboard
 * at the appointed minute to switch anything off.
 *
 * Crawlers never see this: they do not run JavaScript, so a link shared before launch still
 * previews with the site's real title and cover image — which is what you want when the whole
 * point of the countdown is to get people to open it.
 */

const UNITS = ['days', 'hours', 'minutes', 'seconds']

function remaining(target) {
  const ms = Math.max(0, target - Date.now())
  const total = Math.floor(ms / 1000)
  return {
    done: ms === 0,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

export default function LaunchCountdown({ launchAt, onDone }) {
  const { t } = useLang()
  const target = useMemo(() => new Date(launchAt).getTime(), [launchAt])
  const [left, setLeft] = useState(() => remaining(target))

  useEffect(() => {
    if (Number.isNaN(target)) return
    // A plain interval rather than setTimeout chaining: the display is recomputed from the clock
    // every tick, so a throttled background tab or a sleeping laptop catches up on its own
    // instead of drifting by however long it was away.
    const id = setInterval(() => {
      const next = remaining(target)
      setLeft(next)
      if (next.done) { clearInterval(id); onDone?.() }
    }, 1000)
    return () => clearInterval(id)
  }, [target, onDone])

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-2 overflow-hidden px-6 py-12 text-center">
      {/* Stacked above the copy rather than centred behind it. Centred, the mark sat straight on
          top of the headline and the sub-line and made both unreadable — and dimming it enough to
          fix that left it too faint to be the thing the page is built around. */}
      <div
        className="pointer-events-none shrink-0"
        style={{ width: 'min(64vw, 260px)', height: 'min(64vw, 260px)' }}
        aria-hidden="true"
      >
        <LogoNova className="h-full w-full" />
      </div>

      <div className="relative z-[1] mx-auto max-w-[640px]">
        <span className="ngp-kicker mb-6">{t.launchKicker}</span>

        <h1 className="ngp-fluid mb-5 text-[clamp(30px,6.5vw,56px)] font-extrabold leading-[1.12] tracking-[-0.02em]">
          {t.launchTitle} <span className="ngp-grad">{t.launchAccent}</span>
        </h1>

        <p className="mx-auto mb-10 max-w-[480px] text-[clamp(15px,2.4vw,18px)] leading-[1.8] text-muted">
          {t.launchSub}
        </p>

        <div className="mb-10 flex flex-wrap items-stretch justify-center gap-3 sm:gap-4" role="timer" aria-live="off">
          {UNITS.map((unit) => (
            <div
              key={unit}
              className="ngp-card ngp-card--flat min-w-[74px] flex-1 px-3 py-4 sm:min-w-[92px] sm:px-5 sm:py-5"
              style={{ maxWidth: 120 }}
            >
              <div className="font-poppins text-[clamp(26px,6vw,42px)] font-bold leading-none tracking-tight">
                <span className="ngp-grad">{pad(left[unit])}</span>
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[.16em] text-faint sm:text-[10.5px]">
                {t.launchUnits[unit]}
              </div>
            </div>
          ))}
        </div>

        <div className="ngp-rule mx-auto mb-7 w-[140px]" />

        <div className="flex justify-center pb-[260px]">
          <LanguageMenu />
        </div>
      </div>
    </div>
  )
}
