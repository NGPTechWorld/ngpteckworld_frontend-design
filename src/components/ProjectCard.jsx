import { Link } from 'react-router-dom'
import ProjectCover from './ProjectCover'
import { useLang } from '../i18n/LanguageContext'

export default function ProjectCard({ project }) {
  const { pick, t } = useLang()
  const statusLabel = project.status === 'completed' ? t.statusCompleted : t.statusInProgress
  return (
    <Link to={`/portfolio/${project.slug}`}
      className="card-lift block overflow-hidden rounded-card border border-[var(--border)] bg-[var(--card-bg)] shadow-cardhover">
      <ProjectCover project={project} height={190} statusLabel={statusLabel} />
      <div className="p-[22px]">
        <div className="mb-1.5 text-[12.5px] text-accent-light">{t.catLabels[project.category]} · {project.year}</div>
        <h3 className="mb-2 text-[19px] font-semibold">{pick(project, 'name')}</h3>
        <p className="text-[13.5px] leading-[1.6] text-muted">{pick(project, 'short')}</p>
      </div>
    </Link>
  )
}
