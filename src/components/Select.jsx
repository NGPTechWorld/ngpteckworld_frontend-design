import { useEffect, useRef, useState } from 'react'

/**
 * A fully custom single-select dropdown. Native <select> option lists are rendered by the OS/browser and
 * cannot be restyled with CSS in any browser, which left the popup looking out of place against the dark
 * theme even once the closed box was themed. This reimplements the ARIA "collapsible listbox" pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/) so both the closed
 * button and the open list match the site.
 *
 * `options`: [{ value, label }]. Controlled: `value` (string) + `onChange(value)`.
 */
export default function Select({ id, value, onChange, options, placeholder, ariaLabel, invalid, describedBy, className = '', style }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const listRef = useRef(null)

  const selectedIndex = options.findIndex((o) => String(o.value) === String(value))
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  useEffect(() => {
    if (!open) return undefined
    const onDocPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocPointerDown)
    return () => document.removeEventListener('mousedown', onDocPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    listRef.current?.focus()
    // Only when the list opens — re-running on every value/selectedIndex change would fight the user's arrow keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open && activeIndex >= 0) listRef.current?.children[activeIndex]?.scrollIntoView?.({ block: 'nearest' })
  }, [open, activeIndex])

  const commit = (index) => {
    const opt = options[index]
    setOpen(false)
    buttonRef.current?.focus()
    if (opt) onChange(opt.value)
  }

  const onButtonKeyDown = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      setOpen(true)
    }
  }

  const onListKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(options.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActiveIndex(0) }
    else if (e.key === 'End') { e.preventDefault(); setActiveIndex(options.length - 1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commit(activeIndex) }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); buttonRef.current?.focus() }
    else if (e.key === 'Tab') setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-invalid={invalid ? 'true' : undefined}
        aria-describedby={describedBy}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKeyDown}
        className={`${className} flex w-full items-center justify-between gap-3 text-start`}
        style={style}
      >
        <span className="truncate" style={!selected ? { color: '#8B7C9E' } : undefined}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9678BE" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s', flex: 'none' }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
          onKeyDown={onListKeyDown}
          className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-[11px] border py-1.5 shadow-xl outline-none"
          style={{ background: '#241534', borderColor: 'var(--border-accent)' }}
        >
          {options.map((opt, index) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <li
                key={opt.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(index)}
                className="cursor-pointer px-4 py-2.5 text-[14.5px]"
                style={{
                  background: index === activeIndex ? 'rgba(150,120,190,.22)' : 'transparent',
                  color: isSelected ? 'var(--accent-lighter)' : 'var(--ink)',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {opt.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
