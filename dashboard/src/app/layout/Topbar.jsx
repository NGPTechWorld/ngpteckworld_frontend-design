import { Languages, LogOut, Menu, UserRound } from 'lucide-react'
import { useCommon, useLanguage, useStrings } from '@/i18n'
import { Avatar, Button, Dropdown, IconButton } from '@/ui'
import { useAuth } from '../AuthProvider'
import strings from '../strings'

/** Top bar: menu button (mobile), language toggle and the signed-in user's menu. `accountTo` adds an "account" link. */
export function Topbar({ onMenu, menuOpen, accountTo }) {
  const c = useCommon()
  const t = useStrings(strings)
  const { isAr, toggle } = useLanguage()
  const { user, logout } = useAuth()

  const items = [
    ...(accountTo ? [{ key: 'account', label: t.account, icon: UserRound, to: accountTo }] : []),
    { key: 'logout', label: t.signOut, icon: LogOut, tone: 'danger', onClick: logout },
  ]

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/[.07] bg-deep/80 px-4 backdrop-blur sm:px-6">
      <IconButton icon={Menu} label={c.openMenu} onClick={onMenu} aria-expanded={menuOpen} aria-controls="app-sidebar" className="lg:hidden" />

      <div className="ms-auto flex items-center gap-1.5">
        <Button variant="ghost" size="sm" icon={Languages} onClick={toggle} aria-label={c.switchLanguageLabel} lang={isAr ? 'en' : 'ar'}>
          {c.switchLanguage}
        </Button>

        {user ? (
          <Dropdown
            ariaLabel={t.accountMenu}
            label={
              <>
                <Avatar name={user.name} size="sm" />
                <span className="hidden max-w-[10rem] truncate text-sm font-semibold sm:inline">{user.name}</span>
              </>
            }
            header={
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-faint">{t.signedInAs}</p>
                <p className="truncate text-sm font-bold text-ink">{user.name}</p>
                <p className="truncate text-xs text-muted" dir="ltr">
                  {user.email}
                </p>
              </div>
            }
            items={items}
          />
        ) : null}
      </div>
    </header>
  )
}
