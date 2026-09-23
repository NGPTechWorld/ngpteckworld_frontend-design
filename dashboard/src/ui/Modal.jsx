import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useCommon } from '@/i18n'
import { cx } from '@/lib/cx'
import { IconButton } from './IconButton'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

// Open modals, topmost last: Escape closes only the top one and the body scroll lock is released with the last.
const stack = []
let previousOverflow = ''

/**
 * Accessible dialog rendered in a portal: focus moves inside and returns to the trigger on close, Tab is trapped,
 * Escape and a click on the backdrop call `onClose`, the page behind does not scroll.
 *
 *   <Modal open={open} onClose={() => setOpen(false)} title="Edit link" footer={<Button>Save</Button>}>…</Modal>
 *
 * `initialFocusRef` chooses the element focused first (default: the first focusable one).
 */
export function Modal({ open, onClose, title, description, size = 'md', footer, closeOnBackdrop = true, hideClose = false, initialFocusRef, className, children }) {
  const c = useCommon()
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const token = Symbol('modal')
    const opener = document.activeElement
    stack.push(token)
    if (stack.length === 1) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }

    const dialog = dialogRef.current
    const first = initialFocusRef?.current ?? dialog?.querySelector(FOCUSABLE) ?? dialog
    first?.focus()

    const onKeyDown = (event) => {
      if (stack[stack.length - 1] !== token) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => !el.closest('[hidden]') && getComputedStyle(el).visibility !== 'hidden')
      if (!items.length) {
        event.preventDefault()
        return
      }
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === firstItem || !dialog.contains(document.activeElement))) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && (document.activeElement === lastItem || !dialog.contains(document.activeElement))) {
        event.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      stack.splice(stack.indexOf(token), 1)
      if (stack.length === 0) document.body.style.overflow = previousOverflow
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus()
    }
  }, [open, initialFocusRef])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-0 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onCloseRef.current?.()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cx(
          'relative flex max-h-[92dvh] w-full flex-col rounded-t-panel border border-white/[.1] bg-surface shadow-pop animate-pop-in focus:outline-none sm:max-h-[85dvh] sm:rounded-panel',
          sizes[size],
          className,
        )}
      >
        {title || !hideClose ? (
          <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-2 pt-5">
            <div className="min-w-0">
              {title ? (
                <h2 id={titleId} className="text-lg font-bold text-ink">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm text-muted">
                  {description}
                </p>
              ) : null}
            </div>
            {!hideClose ? <IconButton icon={X} label={c.close} onClick={() => onCloseRef.current?.()} className="-me-2 -mt-1" /> : null}
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3">{children}</div>
        {footer ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/[.08] px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
