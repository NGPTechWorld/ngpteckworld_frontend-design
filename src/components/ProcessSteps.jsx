import SectionHeader from './SectionHeader'
import { useLang } from '../i18n/LanguageContext'
import { useSpotlight } from '../lib/useSpotlight'

function Step({ step, index, total }) {
  const spot = useSpotlight()
  return (
    <div ref={spot} data-rise className="ngp-card relative flex h-full flex-col p-7">
      <span className="ngp-bracket ngp-bracket--tl" />
      <span className="ngp-bracket ngp-bracket--br" />

      {/* The connector only exists between steps, so the last card does not trail a line into
          empty space. Hidden below lg, where the cards stack and a horizontal rule would point
          sideways at nothing. */}
      {index < total - 1 && (
        <span
          className="absolute top-[54px] hidden h-px w-[18px] lg:block"
          style={{
            insetInlineStart: '100%',
            background: 'linear-gradient(90deg, rgba(150,120,190,.5), transparent)',
          }}
        />
      )}

      <div className="ngp-hex mb-5 shrink-0">
        <span className="font-poppins text-[17px] font-bold text-ink">{index + 1}</span>
      </div>
      <h3 className="mb-2 text-[clamp(16px,2.4vw,18.5px)] font-semibold">{step.t}</h3>
      <p className="text-[14px] leading-[1.7] text-muted">{step.d}</p>
    </div>
  )
}

export default function ProcessSteps() {
  const { t } = useLang()
  const steps = t.processSteps ?? []

  return (
    <section className="ngp-section">
      <SectionHeader kicker={t.processKick} title={t.processTitle} sub={t.processSub} />
      <div data-stagger className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => <Step key={i} step={s} index={i} total={steps.length} />)}
      </div>
    </section>
  )
}
