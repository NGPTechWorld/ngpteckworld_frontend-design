import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'

export default function NotFound() {
  const { isAr } = useLang()
  return (
    <section className="mx-auto max-w-site px-[26px] py-[120px] text-center">
      <h1 className="mb-4 text-[44px] font-extrabold">404</h1>
      <p className="mb-8 text-muted">{isAr ? 'الصفحة غير موجودة' : 'Page not found'}</p>
      <Link to="/" className="btn-p rounded-xl bg-accent px-7 py-3.5 font-semibold text-white">
        {isAr ? 'العودة للرئيسية' : 'Back home'}
      </Link>
    </section>
  )
}
