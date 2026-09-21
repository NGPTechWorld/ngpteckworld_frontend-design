import SectionHeader from './SectionHeader'
import { useLang } from '../i18n/LanguageContext'

export default function ProcessSteps() {
  const { t } = useLang()
  return (
    <section className="mx-auto max-w-site px-[26px] pb-[90px]">
      <SectionHeader kicker={t.processKick} title={t.processTitle} sub={t.processSub} />
      <div data-grid4 className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {t.processSteps.map((s, i) => (
          <div key={i} className="rounded-card border border-[var(--border)] bg-[var(--card-bg)] p-7">
            <div
              className="mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-xl font-poppins text-[18px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#6B4E8E,#9678BE)' }}
            >
              {i + 1}
            </div>
            <h3 className="mb-2 text-[18px] font-semibold">{s.t}</h3>
            <p className="text-[14px] leading-[1.7] text-muted">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
