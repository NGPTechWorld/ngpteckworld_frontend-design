import Icon from './Icon'
import { iconPaths } from '../lib/visuals'
import { useLang } from '../i18n/LanguageContext'
import { useSpotlight } from '../lib/useSpotlight'

export default function ServiceCard({ service, index }) {
  const { pick } = useLang()
  const spot = useSpotlight()
  const features = pick(service, 'features') || []

  return (
    <div ref={spot} className="ngp-card group flex h-full flex-col p-7 sm:p-8">
      <span className="ngp-bracket ngp-bracket--tl" />
      <span className="ngp-bracket ngp-bracket--br" />

      {/* The index doubles as a quiet ordinal — it reads as a spec sheet rather than decoration. */}
      {typeof index === 'number' && (
        <div className="absolute top-6 font-mono text-[11px] tracking-[.2em] text-faint" style={{ insetInlineEnd: '24px' }}>
          {String(index + 1).padStart(2, '0')}
        </div>
      )}

      <div className="ngp-hex mb-6">
        <Icon path={iconPaths[service.icon_key]} size={24} stroke="#E2D2F6" />
      </div>

      <h3 className="mb-2.5 text-[clamp(17px,2.6vw,20px)] font-semibold leading-snug">{pick(service, 'title')}</h3>
      <p className="mb-5 text-[14.5px] leading-[1.7] text-muted">{pick(service, 'description')}</p>

      {features.length > 0 && (
        <div className="mt-auto flex flex-col gap-2.5 border-t border-white/[.07] pt-5">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[13.5px] leading-[1.5] text-soft">
              <span className="mt-[3px] shrink-0">
                <Icon path='<polyline points="20 6 9 17 4 12"/>' size={14} stroke="#9678BE" strokeWidth={3} />
              </span>
              {f}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
