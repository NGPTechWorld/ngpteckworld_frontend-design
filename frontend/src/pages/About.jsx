import { useLang } from '../i18n/LanguageContext'
import Icon from '../components/Icon'
import { iconPaths } from '../lib/visuals'

export default function About() {
  const { t } = useLang()
  return (
    <div className="view-enter mx-auto max-w-narrow px-[26px] pb-[90px] pt-[70px]">
      <div className="mb-[50px] text-center">
        <div className="mb-2.5 font-mono text-[13px] text-accent-light">// {t.navAbout}</div>
        <h1 className="mb-[18px] text-[44px] font-extrabold">{t.aboutTitle}</h1>
        <p className="mx-auto max-w-[720px] text-[17px] leading-[1.9] text-soft">{t.aboutStory}</p>
      </div>

      <div data-grid2 className="mb-[18px] grid gap-[18px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {[['visionT', 'vision'], ['missionT', 'mission']].map(([tk, bk]) => (
          <div key={tk} className="rounded-card border border-[var(--border-accent)] p-8" style={{ background: 'linear-gradient(135deg,rgba(107,78,142,.2),rgba(48,29,61,.3))' }}>
            <h3 className="mb-2.5 text-[20px] font-bold text-accent-lighter">{t[tk]}</h3>
            <p className="text-[15.5px] leading-[1.8] text-soft">{t[bk]}</p>
          </div>
        ))}
      </div>

      <div className="my-[46px]">
        <h2 className="mb-7 text-center text-[28px] font-bold">{t.valuesT}</h2>
        <div data-grid4 className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {t.values.map((v) => (
            <div key={v.key} className="rounded-card border border-[var(--border)] bg-[var(--card-bg)] px-[18px] py-7 text-center">
              <div className="mx-auto mb-3.5 flex h-[46px] w-[46px] items-center justify-center rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#6B4E8E,#9678BE)' }}>
                <Icon path={iconPaths[v.key]} size={22} stroke="#fff" />
              </div>
              <div className="text-[16px] font-semibold">{v.t}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[46px]">
        <h2 className="mb-7 text-center text-[28px] font-bold">{t.whyT}</h2>
        <div data-grid2 className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {t.whyus.map((w, i) => (
            <div key={i} className="flex items-start gap-3.5 rounded-[14px] border border-[var(--border)] bg-white/[.02] p-[22px]">
              <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px]" style={{ background: 'linear-gradient(135deg,#6B4E8E,#9678BE)' }}>
                <Icon path='<polyline points="20 6 9 17 4 12"/>' size={17} stroke="#fff" strokeWidth={3} />
              </div>
              <div>
                <div className="mb-1 text-[16px] font-semibold">{w.t}</div>
                <div className="text-[14px] leading-[1.6] text-muted">{w.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
