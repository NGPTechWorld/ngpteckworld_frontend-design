import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLang } from '../i18n/LanguageContext'
import { api } from '../lib/api'
import Icon from '../components/Icon'
import PageTitle from '../components/PageTitle'
import PortfolioItemCard from '../components/PortfolioItemCard'
import PortfolioItemModal from '../components/PortfolioItemModal'
import { initials } from '../lib/visuals'
import { toHttpUrl } from '../lib/url'

const linkIcons = {
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
  website: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  twitter: '<path d="M4 4l16 16M20 4 4 20"/>',
}

function List({ items }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-soft">
          <Icon path='<circle cx="12" cy="12" r="3"/>' size={8} fill="currentColor" stroke="none" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Pills({ items }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((item, i) => (
        <span key={i} className="rounded-full border border-white/[.14] bg-white/[.03] px-4 py-1.5 text-[13.5px] text-[#D8CEE6]">
          {item}
        </span>
      ))}
    </div>
  )
}

export default function TeamMemberDetail() {
  const { slug } = useParams()
  const { t, pick } = useLang()
  const [member, setMember] = useState(null)
  const [openItem, setOpenItem] = useState(null)

  useEffect(() => { setMember(null); setOpenItem(null); api.getTeamMember(slug).then(setMember).catch(() => setMember(false)) }, [slug])

  if (member === false) return <div className="mx-auto max-w-narrow px-[26px] py-24 text-center text-muted">{t.mNotFound}</div>
  if (!member) return <div className="mx-auto max-w-narrow px-[26px] py-24 text-center text-muted">…</div>

  const name = pick(member, 'name')
  const skills = pick(member, 'skills') || []
  const experience = pick(member, 'experience') || []
  const education = pick(member, 'education') || []
  const certifications = pick(member, 'certifications') || []
  const languages = pick(member, 'languages') || []
  const location = pick(member, 'location')
  const department = pick(member, 'department')
  const links = [
    { key: 'linkedin', href: toHttpUrl(member.linkedin_url) },
    { key: 'github', href: toHttpUrl(member.github_url) },
    { key: 'website', href: toHttpUrl(member.website_url) },
    { key: 'twitter', href: toHttpUrl(member.twitter_url) },
  ].filter((l) => l.href)

  return (
    <div className="view-enter mx-auto max-w-narrow px-[26px] pb-[90px] pt-10">
      <PageTitle title={name} description={pick(member, 'bio')} />
      <Link to="/team" className="mb-6 inline-flex items-center gap-2 text-[14px] text-accent-light">{t.mBack}</Link>

      <div className="mb-10 flex flex-wrap items-center gap-6">
        <div className="flex h-[110px] w-[110px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)]"
          style={{ background: 'linear-gradient(135deg,#6B4E8E,#301D3D)' }}>
          {member.avatar ? (
            <img src={member.avatar} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="font-poppins text-[30px] font-bold text-white/85">{initials(name)}</span>
          )}
        </div>
        <div>
          <h1 className="mb-1.5 text-[36px] font-extrabold">{name}</h1>
          <p className="mb-2 text-[16px] text-accent-light">{pick(member, 'job_title')}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-muted">
            {department && <span>{department}</span>}
            {location && <span>{department ? '·' : ''} {location}</span>}
            {member.years_experience != null && <span>{(department || location) ? '·' : ''} {t.mYears(member.years_experience)}</span>}
          </div>
        </div>
      </div>

      {pick(member, 'bio') && (
        <div className="mb-[46px]">
          <h2 className="mb-3.5 text-[24px] font-bold">{t.mAbout}</h2>
          <p className="text-[16.5px] leading-[1.9] text-soft">{pick(member, 'bio')}</p>
        </div>
      )}

      {member.portfolio?.length > 0 && (
        <div className="mb-[46px]">
          <h2 className="mb-[18px] text-[24px] font-bold">{t.mPortfolio}</h2>
          <div data-grid3 className="grid gap-[16px]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {member.portfolio.map((item) => (
              <PortfolioItemCard key={item.id} item={item} onOpen={() => setOpenItem(item)} />
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div className="mb-[46px]">
          <h2 className="mb-[18px] text-[24px] font-bold">{t.mSkills}</h2>
          <Pills items={skills} />
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-[46px]">
          <h2 className="mb-[18px] text-[24px] font-bold">{t.mExperience}</h2>
          <List items={experience} />
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-[46px]">
          <h2 className="mb-[18px] text-[24px] font-bold">{t.mEducation}</h2>
          <List items={education} />
        </div>
      )}

      {certifications.length > 0 && (
        <div className="mb-[46px]">
          <h2 className="mb-[18px] text-[24px] font-bold">{t.mCertifications}</h2>
          <List items={certifications} />
        </div>
      )}

      {languages.length > 0 && (
        <div className="mb-[46px]">
          <h2 className="mb-[18px] text-[24px] font-bold">{t.mLanguages}</h2>
          <Pills items={languages} />
        </div>
      )}

      {links.length > 0 && (
        <div>
          <h2 className="mb-[18px] text-[24px] font-bold">{t.mLinks}</h2>
          <div className="flex flex-wrap gap-3">
            {links.map((l) => (
              <a key={l.key} href={l.href} target="_blank" rel="noreferrer" dir="ltr"
                className="glink inline-flex items-center gap-2.5 rounded-xl border border-white/[.14] bg-white/[.03] px-5 py-2.5 text-[14px] text-[#D8CEE6]">
                <Icon path={linkIcons[l.key]} size={16} stroke="#9678BE" />
                {t.socialMeta[l.key === 'twitter' ? 'x' : l.key]}
              </a>
            ))}
          </div>
        </div>
      )}

      {openItem && <PortfolioItemModal item={openItem} onClose={() => setOpenItem(null)} />}
    </div>
  )
}
