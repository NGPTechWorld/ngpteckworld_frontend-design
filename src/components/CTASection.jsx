import Button from './Button'
import { useLang } from '../i18n/LanguageContext'
import { useSpotlight } from '../lib/useSpotlight'

export default function CTASection() {
  const { t } = useLang()
  const spot = useSpotlight()

  return (
    <section className="ngp-section">
      <div
        ref={spot}
        className="ngp-card ngp-card--flat relative overflow-hidden px-6 py-[clamp(40px,7vw,68px)] text-center"
      >
        <span className="ngp-bracket ngp-bracket--tl" />
        <span className="ngp-bracket ngp-bracket--br" />

        {/* A brighter wash than the standard card surface — this is the one block on the page that
            is meant to pull the eye rather than sit back. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(107,78,142,.28), rgba(48,29,61,.15) 55%, rgba(150,120,190,.16))' }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[280px] w-[560px] max-w-full -translate-x-1/2"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(150,120,190,.3), transparent 68%)' }}
        />

        <div className="relative">
          <h2 className="ngp-fluid mx-auto mb-4 max-w-[680px] text-[clamp(24px,4.4vw,36px)] font-bold leading-[1.2]">
            {t.ctaTitle}
          </h2>
          <p className="mx-auto mb-8 max-w-[520px] text-[clamp(14.5px,2.2vw,17px)] leading-[1.7] text-soft">
            {t.ctaSub}
          </p>
          <Button to="/contact">{t.ctaBtn}</Button>
        </div>
      </div>
    </section>
  )
}
