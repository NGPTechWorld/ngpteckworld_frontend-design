import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useCommon } from '@/i18n'
import { cx } from '@/lib/cx'
import { Button } from './Button'
import { Modal } from './Modal'

/**
 * Controlled confirmation dialog (prefer `useConfirm()` for the usual "are you sure?").
 * Focus starts on Cancel so that Enter never confirms a destructive action by accident.
 */
export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, tone = 'danger', loading = false, onConfirm, onCancel }) {
  const c = useCommon()
  const cancelRef = useRef(null)
  return (
    <Modal open={open} onClose={onCancel} title={title ?? c.confirmDeleteTitle} size="sm" hideClose initialFocusRef={cancelRef}>
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className={cx('mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full', tone === 'danger' ? 'bg-danger/15 text-danger' : 'bg-accent/25 text-accent-lighter')}
        >
          <AlertTriangle size={18} />
        </span>
        <p className="text-sm leading-relaxed text-soft">{message ?? c.confirmDeleteMessage}</p>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel ?? c.cancel}
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel ?? (tone === 'danger' ? c.delete : c.confirm)}
        </Button>
      </div>
    </Modal>
  )
}

const ConfirmContext = createContext(null)

/** Mounted once in the app (and in renderWithProviders). */
export function ConfirmProvider({ children }) {
  const [current, setCurrent] = useState(null) // { options, resolve } — what the dialog shows
  const pending = useRef(null) // same entry, updated synchronously so back-to-back confirm() calls see each other

  const confirm = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        pending.current?.resolve(false) // a newer question cancels the older one
        pending.current = { options, resolve }
        setCurrent(pending.current)
      }),
    [],
  )

  const settle = useCallback((answer) => {
    pending.current?.resolve(answer)
    pending.current = null
    setCurrent(null)
  }, [])

  useEffect(() => () => pending.current?.resolve(false), [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog {...(current?.options || {})} open={Boolean(current)} onConfirm={() => settle(true)} onCancel={() => settle(false)} />
    </ConfirmContext.Provider>
  )
}

/**
 * const confirm = useConfirm()
 * if (await confirm({ title, message, confirmLabel, cancelLabel, tone: 'danger' | 'primary' })) doIt()
 * Resolves true on confirm, false on cancel / Escape / backdrop click. All options are optional
 * (defaults: "Confirm deletion" / danger).
 */
export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm() must be used inside <ConfirmProvider>')
  return confirm
}
