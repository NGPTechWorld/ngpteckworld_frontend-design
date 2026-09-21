import Icon from './Icon'
import { iconPaths } from '../lib/visuals'
import { useLang } from '../i18n/LanguageContext'

export default function ServiceCard({ service }) {
  const { pick } = useLang()
  const features = pick(service, 'features') || []
  return (
    <div className="card-lift rounded-card border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-cardhover">
      <div className="mb-5 flex h-[54px] w-[54px] items-center justify-center rounded-[14px]"
        style={{ background: 'linear-gradient(135deg,rgba(107,78,142,.4),rgba(150,120,190,.2))', color: '#C5B2E0' }}>
        <Icon path={iconPaths[service.icon_key]} size={24} stroke="#C5B2E0" />
      </div>
      <h3 className="mb-2 text-[20px] font-semibold">{pick(service, 'title')}</h3>
      <p className="mb-[18px] text-[14.5px] leading-[1.65] text-muted">{pick(service, 'description')}</p>
      <div className="flex flex-col gap-2.5 border-t border-white/[.07] pt-4">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2.5 text-[13.5px] text-soft">
            <Icon path='<polyline points="20 6 9 17 4 12"/>' size={15} stroke="#9678BE" strokeWidth={3} />
            {f}
          </div>
        ))}
      </div>
    </div>
  )
}
