import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'
import { initials } from '../lib/visuals'
import { useSpotlight } from '../lib/useSpotlight'
import SmartImage from './fx/SmartImage'

export default function TeamProfileCard({ member }) {
  const { pick, t } = useLang()
  const spot = useSpotlight()
  const name = pick(member, 'name')
  const role = pick(member, 'job_title')

  // Doubles as SmartImage's fallback, so a broken upload lands on the same panel as no upload.
  const initialsPanel = (
    <div
      className="ngp-team__img absolute inset-0 grid place-items-center"
      style={{ background: 'linear-gradient(135deg,#6B4E8E,#301D3D)' }}
    >
      <span className="font-poppins text-[42px] font-bold text-white/85">{initials(name)}</span>
    </div>
  )

  return (
    <Link
      ref={spot}
      to={`/team/${member.slug}`}
      className="ngp-card ngp-team group block h-full"
      aria-label={name}
    >
      <span className="ngp-bracket ngp-bracket--tl" />
      <span className="ngp-bracket ngp-bracket--br" />

      {/* Square by declaration, not by hoping the upload is square. Portraits arrive from the
          dashboard at whatever ratio the photographer used; a fixed 1:1 box with object-cover
          means a row of cards lines up whatever it is given. */}
      <div className="ngp-team__frame">
        {member.avatar ? (
          <SmartImage
            src={member.avatar}
            className="absolute inset-0"
            imgClassName="ngp-team__img"
            objectPosition="50% 28%"
            fallback={initialsPanel}
          />
        ) : initialsPanel}

        {/* Scrim: photos come in at every exposure, and without it a bright one leaves the card's
            top edge glaring against the dark page while a dark one disappears into it. */}
        <div className="ngp-team__scrim" />

        {/* Slides up from under the scrim on hover. */}
        <span className="ngp-team__cue">
          {t.teamView}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="ngp-team__arrow">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>

      <div className="p-[18px] text-center sm:p-[22px]">
        <h3 className="mb-1.5 text-[clamp(16px,2.3vw,19px)] font-semibold leading-snug transition-colors duration-300 group-hover:text-accent-lighter">
          {name}
        </h3>
        <p className="text-[13.5px] leading-snug text-accent-light">{role}</p>
      </div>
    </Link>
  )
}
