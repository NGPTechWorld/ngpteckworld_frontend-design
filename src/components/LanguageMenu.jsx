import { useEffect, useId, useRef, useState } from 'react'
import { useLang } from '../i18n/LanguageContext'

/**
 * The language switcher.
 *
 * It replaced a two-state toggle button, which stopped making sense the moment there were ten
 * languages rather than two. Each option is written in its own language — a German visitor is
 * looking for the word "Deutsch", not for "German" spelled out in Arabic — which is also why the
 * list is not translated along with the rest of the interface.
 *
 * `placement` exists for the countdown screen, where the switcher is the last thing on a
 * vertically centred page and a list dropping below it would open past the bottom of the viewport.
 */
export default function LanguageMenu({ className = '', placement = 'down' }) {
  const { lang, languages, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = languages.find((l) => l.code === lang) ?? languages[0]

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Language — ${current.english}`}
        className="btn flex items-center gap-1.5 rounded-full border border-white/15 bg-transparent px-3 py-2 font-poppins text-[13px] font-semibold uppercase text-ink"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        </svg>
        {current.code}
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Language"
          className={`ngp-langmenu absolute z-50 min-w-[168px] overflow-hidden rounded-2xl border py-1.5 ${
            placement === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {languages.map((l) => {
            const active = l.code === lang
            return (
              <li key={l.code} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  lang={l.code}
                  dir={l.dir}
                  onClick={() => {
                    setLang(l.code)
                    setOpen(false)
                  }}
                  className={`ngp-langmenu__item flex w-full items-center justify-between gap-3 px-4 py-2.5 text-start text-[14px] ${
                    active ? 'is-active' : ''
                  }`}
                >
                  <span>{l.label}</span>
                  <span className="font-mono text-[10.5px] uppercase tracking-[.12em] text-faint">{l.code}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
