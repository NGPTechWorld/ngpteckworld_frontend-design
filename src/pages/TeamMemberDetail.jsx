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
import { dateRange } from '../lib/cv'

const LINK_ICON = '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>'

const platformIcons = {
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
  website: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  x: '<path d="M4 4l16 16M20 4 4 20"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
  youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
  behance: '<path d="M3 7h5a3 3 0 0 1 0 6H3zM3 13h6a3 3 0 0 1 0 6H3zM15 8h5M14 15a3.5 3.5 0 1 1 7 0h-7a3.5 3.5 0 0 0 6.5 1.8"/>',
  dribbble: '<circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6 6 9.42 8 17.72M19.13 5.09c-3.5 4.1-8.7 5.3-16 5.4M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32"/>',
  telegram: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  whatsapp: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  other: LINK_ICON,
}

/** The band every CV section starts with — the same look for all of them, like a printed CV. */
function Section({ title, children }) {
  return (
    <section className="mb-[42px]">
      <h2 className="mb-[22px] rounded-lg border border-white/[.08] bg-white/[.04] px-4 py-2.5 text-center text-[20px] font-bold tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Opens an entry's link in a new tab — only rendered for a plain http(s) URL. */
function ExternalLink({ href, name }) {
  const { t } = useLang()
  const safe = toHttpUrl(href)
  if (!safe) return null
  return (
    <a href={safe} target="_blank" rel="noreferrer" aria-label={t.mOpenLink(name)} className="ms-1.5 inline-flex align-middle text-accent-light hover:text-white">
      <Icon path={LINK_ICON} size={13} />
    </a>
  )
}

/** Experience / education line: what + where on one side, dates + place on the other. */
function TimelineEntry({ title, subtitle, description, dates, location }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1">
      <div className="min-w-0 flex-1 basis-[320px]">
        <h3 className="text-[16.5px] font-bold" dir="auto">{title}</h3>
        {subtitle && <p className="text-[15px] italic text-[#D8CEE6]" dir="auto">{subtitle}</p>}
        {description && <p className="mt-1.5 whitespace-pre-line text-[15px] leading-[1.75] text-soft" dir="auto">{description}</p>}
      </div>
      {(dates || location) && (
        <div className="shrink-0 text-end text-[14px] leading-[1.7] text-muted">
          {dates && <div dir="ltr">{dates}</div>}
          {location && <div dir="auto">{location}</div>}
        </div>
      )}
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
  const skills = member.skills ?? []
  const experience = member.experience ?? []
  const education = member.education ?? []
  const certifications = member.certifications ?? []
  const languages = member.languages ?? []
  const location = pick(member, 'location')
  const department = pick(member, 'department')
  const links = (member.social_links ?? [])
    .map((link) => ({ ...link, href: toHttpUrl(link.url) }))
    .filter((link) => link.href)

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
          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {links.map((link, i) => {
                const label = link.platform === 'other' ? (link.label || t.socialMeta.website) : (t.socialMeta[link.platform] ?? link.platform)
                return (
                  <a key={i} href={link.href} target="_blank" rel="noreferrer" aria-label={label} title={label}
                    className="glink inline-flex items-center gap-2 rounded-xl border border-white/[.14] bg-white/[.03] px-3.5 py-2 text-[13.5px] text-[#D8CEE6]">
                    <Icon path={platformIcons[link.platform] ?? LINK_ICON} size={15} stroke="#9678BE" />
                    <span dir="auto">{label}</span>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {pick(member, 'bio') && (
        <Section title={t.mAbout}>
          <p className="whitespace-pre-line text-[16px] leading-[1.9] text-soft">{pick(member, 'bio')}</p>
        </Section>
      )}

      {skills.length > 0 && (
        <Section title={t.mSkills}>
          <div data-grid2 className="grid gap-x-10 gap-y-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {skills.map((skill, i) => (
              <div key={i}>
                <h3 className="text-[16.5px] font-bold" dir="auto">{pick(skill, 'title')}</h3>
                {pick(skill, 'description') && <p className="mt-1 whitespace-pre-line text-[15px] leading-[1.75] text-soft" dir="auto">{pick(skill, 'description')}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {experience.length > 0 && (
        <Section title={t.mExperience}>
          <div className="flex flex-col gap-7">
            {experience.map((job, i) => (
              <TimelineEntry key={i}
                title={pick(job, 'title')} subtitle={pick(job, 'company')} description={pick(job, 'description')}
                dates={dateRange(job.start, job.end, job.current, t.mPresent)} location={pick(job, 'location')} />
            ))}
          </div>
        </Section>
      )}

      {member.portfolio?.length > 0 && (
        <Section title={t.mPortfolio}>
          <div data-grid3 className="grid gap-[16px]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {member.portfolio.map((item) => (
              <PortfolioItemCard key={item.id} item={item} onOpen={() => setOpenItem(item)} />
            ))}
          </div>
        </Section>
      )}

      {education.length > 0 && (
        <Section title={t.mEducation}>
          <div className="flex flex-col gap-7">
            {education.map((study, i) => (
              <TimelineEntry key={i}
                title={pick(study, 'degree')} subtitle={pick(study, 'school')} description={pick(study, 'description')}
                dates={dateRange(study.start, study.end, study.current, t.mPresent)} location={pick(study, 'location')} />
            ))}
          </div>
        </Section>
      )}

      {certifications.length > 0 && (
        <Section title={t.mCertifications}>
          <div data-grid3 className="grid gap-x-8 gap-y-6" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {certifications.map((cert, i) => (
              <div key={i}>
                <h3 className="text-[16px] font-bold leading-snug" dir="auto">
                  {pick(cert, 'title')}
                  <ExternalLink href={cert.url} name={pick(cert, 'title')} />
                </h3>
                {pick(cert, 'description') && <p className="mt-1 whitespace-pre-line text-[14.5px] leading-[1.7] text-soft" dir="auto">{pick(cert, 'description')}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {languages.length > 0 && (
        <Section title={t.mLanguages}>
          <div data-grid2 className="grid gap-x-10 gap-y-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {languages.map((language, i) => (
              <p key={i} className="text-[15.5px] text-soft" dir="auto">
                <span className="font-bold text-ink">{pick(language, 'name')}</span>
                {pick(language, 'level') && <> — {pick(language, 'level')}</>}
              </p>
            ))}
          </div>
        </Section>
      )}

      {openItem && <PortfolioItemModal item={openItem} onClose={() => setOpenItem(null)} />}
    </div>
  )
}
