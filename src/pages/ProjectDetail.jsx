import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'
import ProjectCover from '../components/ProjectCover'
import TeamCard from '../components/TeamCard'
import Lightbox from '../components/Lightbox'
import Icon from '../components/Icon'
import { galleryBgs } from '../lib/visuals'
import PageTitle from '../components/PageTitle'

export default function ProjectDetail() {
  const { slug } = useParams()
  const { t, pick, isAr } = useLang()
  const [project, setProject] = useState(null)
  const [lb, setLb] = useState(null)

  useEffect(() => { setProject(null); api.getProject(slug).then(setProject).catch(() => setProject(false)) }, [slug])

  if (project === false) return <div className="mx-auto max-w-narrow px-[26px] py-24 text-center text-muted">{isAr ? 'المشروع غير موجود' : 'Project not found'}</div>
  if (!project) return <div className="mx-auto max-w-narrow px-[26px] py-24 text-center text-muted">…</div>

  const bgs = galleryBgs()
  const realGallery = project.gallery && project.gallery.length > 0
  const tiles = realGallery
    ? project.gallery.map((src, i) => ({ src, label: `${t.imgLabel} ${i + 1}`, bg: bgs[i % bgs.length] }))
    : [0, 1, 2, 3].map((i) => ({ src: null, label: `${t.imgLabel} ${i + 1}`, bg: bgs[i % bgs.length] }))
  const statusLabel = project.status === 'completed' ? t.statusCompleted : t.statusInProgress

  return (
    <div className="view-enter mx-auto max-w-narrow px-[26px] pb-[90px] pt-10">
      <PageTitle title={pick(project, 'name')} />
      <Link to="/portfolio" className="mb-6 inline-flex items-center gap-2 text-[14px] text-accent-light">{t.dBack}</Link>

      <div className="mb-2 flex flex-wrap items-center gap-3.5">
        <div className="font-mono text-[13px] text-accent-light">{t.catLabels[project.category]}</div>
        <span style={{ color: '#6B5A80' }}>·</span>
        <span className="text-[14px] text-muted">{project.client}</span>
        <span style={{ color: '#6B5A80' }}>·</span>
        <span className="text-[14px] text-muted">{project.year}</span>
        <span className="rounded-full px-3 py-[3px] text-[12px]" style={{ background: 'rgba(107,78,142,.3)', border: '1px solid rgba(150,120,190,.4)', color: '#D8CEE6' }}>{statusLabel}</span>
      </div>
      <h1 className="mb-6 text-[40px] font-extrabold">{pick(project, 'name')}</h1>

      <div className="mb-10">
        <ProjectCover project={project} height={340} rounded />
      </div>

      <div className="mb-[46px]">
        <h2 className="mb-3.5 text-[24px] font-bold">{t.dAbout}</h2>
        <p className="text-[16.5px] leading-[1.9] text-soft">{pick(project, 'description')}</p>
      </div>

      {/* GALLERY */}
      <div className="mb-[46px]">
        <h2 className="mb-[18px] text-[24px] font-bold">{t.dGallery}</h2>
        <div data-grid3 className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {tiles.map((g, i) => (
            <div key={i} onClick={() => setLb(i)} className="relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-[var(--border)]"
              style={{ aspectRatio: '4/3', background: g.src ? `center/cover no-repeat url(${g.src})` : g.bg }}>
              {!g.src && <><div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg,transparent 0 10px,rgba(0,0,0,.1) 10px 20px)' }} /><span className="relative font-mono text-[12px] text-white/70">{g.label}</span></>}
            </div>
          ))}
        </div>
      </div>

      {/* VIDEO */}
      <div className="mb-[46px]">
        <h2 className="mb-[18px] text-[24px] font-bold">{t.dVideo}</h2>
        {project.video_url ? (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)]" style={{ aspectRatio: '16/9' }}>
            <iframe className="h-full w-full" src={project.video_url} title="project video" allowFullScreen />
          </div>
        ) : (
          <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)]" style={{ aspectRatio: '16/9', background: 'radial-gradient(circle at 50% 45%,#2A1A3C,#150B20)' }}>
            <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg,transparent 0 18px,rgba(255,255,255,.02) 18px 36px)' }} />
            <div className="relative flex flex-col items-center gap-4">
              <div className="flex h-[78px] w-[78px] items-center justify-center rounded-full" style={{ background: '#6B4E8E', boxShadow: '0 14px 36px -8px rgba(107,78,142,.7)' }}>
                <Icon path='<path d="M8 5v14l11-7z"/>' size={30} fill="#fff" stroke="none" />
              </div>
              <span className="font-mono text-[12px] text-muted">{t.dVideoNote}</span>
            </div>
          </div>
        )}
      </div>

      {/* TEAM */}
      <div className="mb-[46px]">
        <h2 className="mb-[18px] text-[24px] font-bold">{t.dTeam}</h2>
        <div data-grid2 className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          {project.team.map((m, i) => <TeamCard key={i} member={m} />)}
        </div>
      </div>

      {/* LINKS */}
      {project.links.length > 0 && (
        <div>
          <h2 className="mb-[18px] text-[24px] font-bold">{t.dLinks}</h2>
          <div className="flex flex-wrap gap-3">
            {project.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer"
                className="glink inline-flex items-center gap-2.5 rounded-xl border border-white/[.14] bg-white/[.03] px-5 py-2.5 text-[14px] text-[#D8CEE6]">
                <Icon path='<path d="M7 17 17 7M9 7h8v8"/>' size={16} stroke="#9678BE" />
                {t.socialMeta[l.type] || l.type}
              </a>
            ))}
          </div>
        </div>
      )}

      {lb !== null && <Lightbox bg={tiles[lb].bg} label={tiles[lb].label} onClose={() => setLb(null)} />}
    </div>
  )
}
