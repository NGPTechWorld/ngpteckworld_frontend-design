import { Link } from 'react-router-dom'
import ProjectCover from './ProjectCover'
import { useLang } from '../i18n/LanguageContext'
import { useSpotlight } from '../lib/useSpotlight'

export default function ProjectCard({ project }) {
  const { pick, t } = useLang()
  const spot = useSpotlight()
  const statusLabel = project.status === 'completed' ? t.statusCompleted : t.statusInProgress

  return (
    <Link
      ref={spot}
      to={`/portfolio/${project.slug}`}
      className="ngp-card group block h-full overflow-hidden"
    >
      <span className="ngp-bracket ngp-bracket--tl" />
      <span className="ngp-bracket ngp-bracket--br" />

      {/* The cover sits in its own clipping context so the zoom on hover cannot spill past the
          card's rounded corner. */}
      <div className="relative overflow-hidden">
        <div className="transition-transform duration-[700ms] ease-[cubic-bezier(.22,.75,.25,1)] group-hover:scale-[1.06]">
          <ProjectCover project={project} height={190} statusLabel={statusLabel} />
        </div>
        {/* Anchors the cover to the card body instead of leaving a hard seam between them. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{ background: 'linear-gradient(to top, rgba(26,15,38,.85), transparent)' }}
        />
      </div>

      <div className="p-[22px]">
        <div className="ngp-kicker mb-2.5 !text-[10.5px]">
          {t.catLabels[project.category]}{project.year ? ' · ' + project.year : ''}
        </div>
        <h3 className="mb-2 text-[clamp(16px,2.4vw,19px)] font-semibold leading-snug transition-colors duration-300 group-hover:text-accent-lighter">
          {pick(project, 'name')}
        </h3>
        <p className="text-[13.5px] leading-[1.65] text-muted">{pick(project, 'short')}</p>
      </div>
    </Link>
  )
}
