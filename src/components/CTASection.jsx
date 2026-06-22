import Button from './Button'
import { useLang } from '../i18n/LanguageContext'

export default function CTASection() {
  const { t } = useLang()
  return (
    <section className="mx-auto max-w-site px-[26px] pb-[90px]">
      <div className="rounded-panel border border-[var(--border-accent)] p-14 text-center"
        style={{ background: 'linear-gradient(135deg,rgba(107,78,142,.25),rgba(48,29,61,.4))' }}>
        <h2 className="mb-3.5 text-[34px] font-bold">{t.ctaTitle}</h2>
        <p className="mb-7 text-[17px] text-soft">{t.ctaSub}</p>
        <Button to="/contact">{t.ctaBtn}</Button>
      </div>
    </section>
  )
}
