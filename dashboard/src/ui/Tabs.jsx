import { useRef } from 'react'
import { useLanguage } from '@/i18n'
import { cx } from '@/lib/cx'
import { focusRing } from './styles'

const tabId = (prefix, key) => `${prefix}-tab-${key}`
const panelId = (prefix, key) => `${prefix}-panel-${key}`

/**
 * Controlled tab list. tabs = [{ key, label, icon?, badge?, disabled? }], value = active key, onChange(key).
 * Left/Right (mirrored in RTL), Home and End move between tabs. Pair with <TabPanel> (same `idPrefix`).
 *
 *   <Tabs idPrefix="project" tabs={tabs} value={tab} onChange={setTab} />
 *   <TabPanel idPrefix="project" value="general" active={tab}>…</TabPanel>
 */
export function Tabs({ tabs, value, onChange, idPrefix = 'tabs', label, className }) {
  const { dir } = useLanguage()
  const refs = useRef({})
  const enabled = tabs.filter((tab) => !tab.disabled)

  const onKeyDown = (event) => {
    const index = enabled.findIndex((tab) => tab.key === value)
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    let next = null
    if (event.key === forward) next = enabled[(index + 1) % enabled.length]
    else if (event.key === backward) next = enabled[(index - 1 + enabled.length) % enabled.length]
    else if (event.key === 'Home') next = enabled[0]
    else if (event.key === 'End') next = enabled[enabled.length - 1]
    if (!next) return
    event.preventDefault()
    onChange?.(next.key)
    refs.current[next.key]?.focus()
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cx('flex gap-1 overflow-x-auto border-b border-white/[.08]', className)}>
      {tabs.map((tab) => {
        const selected = tab.key === value
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            ref={(node) => {
              refs.current[tab.key] = node
            }}
            type="button"
            role="tab"
            id={tabId(idPrefix, tab.key)}
            aria-selected={selected}
            aria-controls={panelId(idPrefix, tab.key)}
            tabIndex={selected ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange?.(tab.key)}
            className={cx(
              '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-40',
              focusRing,
              selected ? 'border-gold text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {Icon ? <Icon size={16} aria-hidden="true" /> : null}
            {tab.label}
            {tab.badge !== undefined && tab.badge !== null ? (
              <span className="rounded-full bg-white/10 px-1.5 text-[11px] font-bold text-soft">{tab.badge}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Content of one tab. Renders nothing unless `value === active`; with `keepMounted` it stays in the DOM (hidden) so form
 * fields keep their state and can still receive focus when validation fails on a tab that is not open.
 */
export function TabPanel({ idPrefix = 'tabs', value, active, keepMounted = false, className, children }) {
  const isActive = value === active
  if (!isActive && !keepMounted) return null
  return (
    <div role="tabpanel" id={panelId(idPrefix, value)} aria-labelledby={tabId(idPrefix, value)} hidden={!isActive} tabIndex={0} className={cx('pt-5 focus:outline-none', className)}>
      {children}
    </div>
  )
}
