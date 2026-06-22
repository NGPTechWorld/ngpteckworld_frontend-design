import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="mt-5 border-t border-[var(--border)]" style={{ background: 'rgba(0,0,0,.22)' }}>
      <div data-grid3 className="mx-auto grid max-w-site gap-[30px] px-[26px] pb-[30px] pt-[46px]" style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}>
        <div>
          <img src="/assets/ngp-logo-white.png" alt="NGP TechWorld" className="mb-3.5 h-[38px] w-auto" />
          <p className="max-w-[280px] text-[14px] leading-[1.7] text-faint">{t.footTagline}</p>
        </div>
        <div>
          <div className="mb-3.5 text-[15px] font-semibold">{t.footQuick}</div>
          <div className="flex flex-col gap-2.5 text-[14px] text-muted">
            <Link to="/" className="hover:text-white">{t.navHome}</Link>
            <Link to="/services" className="hover:text-white">{t.navServices}</Link>
            <Link to="/portfolio" className="hover:text-white">{t.navPortfolio}</Link>
            <Link to="/about" className="hover:text-white">{t.navAbout}</Link>
          </div>
        </div>
        <div>
          <div className="mb-3.5 text-[15px] font-semibold">{t.navContact}</div>
          <div className="flex flex-col gap-2.5 text-[14px] text-muted">
            <span dir="ltr">info@ngptechworld.com</span>
            <span dir="ltr">+963 933 069 105</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/[.06] px-[26px] py-5 text-center text-[13px] text-[#6B5A80]">{t.footRights}</div>
    </footer>
  )
}
