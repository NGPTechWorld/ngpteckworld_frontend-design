import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'
import SectionHeader from '../components/SectionHeader'
import FilterPills from '../components/FilterPills'
import ProjectCard from '../components/ProjectCard'

export default function Portfolio() {
  const { t } = useLang()
  const [projects, setProjects] = useState([])
  const [cat, setCat] = useState('all')
  useEffect(() => { api.getProjects().then(setProjects).catch(() => {}) }, [])

  const filtered = useMemo(
    () => (cat === 'all' ? projects : projects.filter((p) => p.category === cat)),
    [projects, cat],
  )

  return (
    <div className="view-enter mx-auto max-w-site px-[26px] pb-[90px] pt-[70px]">
      <SectionHeader as="h1" kicker={t.featuredKick} title={t.portfolioTitle} sub={t.portfolioSub} />
      <FilterPills active={cat} onSelect={setCat} />
      <div data-grid3 className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
      </div>
    </div>
  )
}
