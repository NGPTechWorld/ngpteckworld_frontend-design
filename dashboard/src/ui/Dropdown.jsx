import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { cx } from '@/lib/cx'
import { focusRing } from './styles'

/**
 * Button + popup menu (user menu, "more" menus). Keyboard: Enter/Space/ArrowDown open, Arrow keys move,
 * Home/End jump, Escape closes and returns focus, Tab closes, click outside closes.
 *
 *   <Dropdown
 *     label={<><Avatar name="Ali" size="sm" /> Ali</>}      // content of the trigger button
 *     ariaLabel="Account menu"
 *     header={<div>ali@ngptechworld.com</div>}               // non-interactive block at the top (optional)
 *     items={[{ key: 'out', label: 'Sign out', icon: LogOut, onClick, tone: 'danger' }, { key: 'me', label: 'Account', to: '/users' }]}
 *   />
 * Items: { key, label, icon?, onClick?, to?, tone?: 'danger', disabled?, separator?: true }.
 */
export function Dropdown({ label, ariaLabel, items, header, align = 'end', chevron = true, buttonClassName, menuClassName, className }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()

  const actionable = () => [...(menuRef.current?.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])') ?? [])]

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (open) actionable()[0]?.focus()
  }, [open])

  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }

  const onButtonKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
    }
  }

  const onMenuKeyDown = (event) => {
    const nodes = actionable()
    const index = nodes.indexOf(document.activeElement)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      nodes[(index + 1) % nodes.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      nodes[(index - 1 + nodes.length) % nodes.length]?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      nodes[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      nodes[nodes.length - 1]?.focus()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close()
    } else if (event.key === 'Tab') {
      close(false)
    }
  }

  return (
    <div ref={rootRef} className={cx('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onButtonKeyDown}
        className={cx('inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-ink transition-colors hover:bg-white/[.07]', focusRing, buttonClassName)}
      >
        {label}
        {chevron ? <ChevronDown size={15} aria-hidden="true" className={cx('text-muted transition-transform', open && 'rotate-180')} /> : null}
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          onKeyDown={onMenuKeyDown}
          className={cx(
            'absolute top-full z-40 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-white/[.1] bg-surface py-1 shadow-pop animate-pop-in',
            align === 'end' ? 'end-0' : 'start-0',
            menuClassName,
          )}
        >
          {header ? <div className="border-b border-white/[.08] px-4 py-3">{header}</div> : null}
          {items.map((item, index) => {
            if (item.separator) return <div key={item.key ?? `sep-${index}`} role="separator" className="my-1 h-px bg-white/[.08]" />
            const Icon = item.icon
            const cls = cx(
              'flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm transition-colors focus:outline-none',
              item.disabled ? 'cursor-not-allowed opacity-45' : item.tone === 'danger' ? 'text-danger hover:bg-danger/10 focus:bg-danger/10' : 'text-ink hover:bg-white/[.07] focus:bg-white/[.07]',
            )
            const content = (
              <>
                {Icon ? <Icon size={16} aria-hidden="true" /> : null}
                {item.label}
              </>
            )
            if (item.to && !item.disabled) {
              return (
                <Link key={item.key} to={item.to} role="menuitem" className={cls} onClick={() => close(false)}>
                  {content}
                </Link>
              )
            }
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                aria-disabled={item.disabled || undefined}
                className={cls}
                onClick={() => {
                  if (item.disabled) return
                  close(false)
                  item.onClick?.()
                }}
              >
                {content}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
