import { Link, NavLink } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'

const linkClass = 'text-soft hover:text-white transition-colors text-[15px] cursor-pointer'

export default function Navbar() {
  const { t, toggle } = useLang()
  const links = [
    ['/', t.navHome], ['/services', t.navServices], ['/portfolio', t.navPortfolio],
    ['/about', t.navAbout], ['/contact', t.navContact],
  ]
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)]" style={{ backdropFilter: 'blur(16px)', background: 'rgba(26,15,38,.78)' }}>
      <div className="mx-auto flex max-w-site items-center gap-5 px-[26px] py-3.5">
        <Link to="/" className="flex items-center">
          <img src="/assets/ngp-logo-white.png" alt="NGP TechWorld" className="h-[34px] w-auto" />
        </Link>
        <div data-navlinks className="mx-auto flex items-center gap-6">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={linkClass}>{label}</NavLink>
          ))}
        </div>
        <button onClick={toggle} className="btn min-w-[42px] rounded-full border border-white/15 bg-transparent px-3 py-2 font-poppins text-[13px] font-semibold text-ink">
          {t.langBtn}
        </button>
        <Link to="/contact" className="btn-p rounded-full bg-accent px-5 py-2.5 text-[14px] font-semibold text-white">
          {t.navCta}
        </Link>
      </div>
    </nav>
  )
}
