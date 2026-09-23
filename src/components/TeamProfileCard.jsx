import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'
import { initials } from '../lib/visuals'

export default function TeamProfileCard({ member }) {
  const { pick } = useLang()
  const name = pick(member, 'name')
  return (
    <Link to={`/team/${member.slug}`}
      className="card-lift block overflow-hidden rounded-card border border-[var(--border)] bg-[var(--card-bg)] shadow-cardhover">
      <div className="flex items-center justify-center" style={{ height: 220, background: 'linear-gradient(135deg,#6B4E8E,#301D3D)' }}>
        {member.avatar ? (
          <img src={member.avatar} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="font-poppins text-[42px] font-bold text-white/85">{initials(name)}</span>
        )}
      </div>
      <div className="p-[22px] text-center">
        <h3 className="mb-1.5 text-[19px] font-semibold">{name}</h3>
        <p className="text-[13.5px] text-accent-light">{pick(member, 'job_title')}</p>
      </div>
    </Link>
  )
}
