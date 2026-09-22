import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { useCommon, useLanguage, useStrings } from '@/i18n'
import { cx } from '@/lib/cx'
import { IconButton, focusRing } from '@/ui'
import strings from '../strings'
import { Brand } from './Brand'

/**
 * Left/right (start side) navigation. `groups` comes from buildNav(features). From `lg` up it is a sticky column;
 * below that it is an off-canvas drawer controlled by `open` / `onClose` (backdrop click and Escape close it).
 */
export function Sidebar({ groups, open, onClose }) {
  const c = useCommon()
  const t = useStrings(strings)
  const { pick } = useLanguage()

  return (
    <>
      {open ? <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] animate-fade-in lg:hidden" onClick={onClose} aria-hidden="true" data-testid="sidebar-backdrop" /> : null}

      <aside
        id="app-sidebar"
        aria-label={c.mainNavigation}
        className={cx(
          // The closed drawer is only hidden (never translated off-screen): an off-screen fixed box makes mobile browsers
          // widen the layout viewport in RTL.
          'fixed inset-y-0 start-0 z-40 flex w-72 flex-col border-e border-white/[.08] bg-surface',
          'lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:shrink-0 lg:visible',
          open ? 'visible origin-left animate-drawer-in rtl:origin-right' : 'max-lg:invisible',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[.07] px-5">
          <div className="flex items-center gap-3">
            <Brand size={28} />
            <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold">{t.brandTagline}</span>
          </div>
          <IconButton icon={X} label={c.closeMenu} onClick={onClose} className="lg:hidden" />
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {groups.map(({ group, items }) => (
            <div key={group}>
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-faint">{c.groups[group] ?? group}</p>
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cx(
                            'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                            focusRing,
                            isActive ? 'bg-accent/25 text-white' : 'text-muted hover:bg-white/[.06] hover:text-ink',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {Icon ? <Icon size={18} aria-hidden="true" className={isActive ? 'text-gold' : undefined} /> : null}
                            <span className="truncate">{pick(item.label)}</span>
                            {isActive ? <span aria-hidden="true" className="absolute inset-y-2 start-0 w-1 rounded-full bg-gold" /> : null}
                          </>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
