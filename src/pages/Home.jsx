import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'
import Button from '../components/Button'
import SectionHeader from '../components/SectionHeader'
import ServiceCard from '../components/ServiceCard'
import ProjectCard from '../components/ProjectCard'
import CTASection from '../components/CTASection'
import PageTitle from '../components/PageTitle'

export default function Home() {
  const { t } = useLang()
  const [services, setServices] = useState([])
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    api.getServices().then((s) => setServices(s.slice(0, 3))).catch(() => {})
    api.getProjects().then((p) => setFeatured(p.slice(0, 3))).catch(() => {})
  }, [])

  return (
    <div className="view-enter">
      <PageTitle title={t.navHome} />
      {/* HERO */}
      <section data-hero className="mx-auto grid max-w-site items-center gap-10 px-[26px] pb-[70px] pt-[84px]" style={{ gridTemplateColumns: '1.1fr .9fr' }}>
        <div>
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border px-[15px] py-[7px] text-[13px] text-soft" style={{ borderColor: 'rgba(150,120,190,.4)' }}>
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: '#9678BE', boxShadow: '0 0 10px #9678BE' }} />
            {t.heroBadge}
          </div>
          <h1 className="mb-5 text-[56px] font-extrabold leading-[1.12]">{t.heroT1} <span className="text-accent-light">{t.heroAccent}</span></h1>
          <p className="mb-8 max-w-[500px] text-[18px] leading-[1.8] text-muted">{t.heroSub}</p>
          <div className="flex flex-wrap gap-3.5">
            <Button to="/contact">{t.heroCta1}</Button>
            <Button to="/portfolio" variant="outline">{t.heroCta2}</Button>
          </div>
        </div>
        <div className="relative flex min-h-[320px] items-center justify-center">
          <div className="absolute h-[300px] w-[300px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(107,78,142,.4),transparent 68%)' }} />
          <div className="absolute h-[330px] w-[330px] rounded-full border border-dashed" style={{ borderColor: 'rgba(150,120,190,.25)', animation: 'ngpRot 44s linear infinite' }} />
          <img src="/assets/ngp-mark-white.png" alt="NGP" className="relative w-[170px]" style={{ animation: 'ngpFloat 6s ease-in-out infinite', filter: 'drop-shadow(0 0 28px rgba(150,120,190,.5))' }} />
        </div>
      </section>

      {/* INTRO */}
      <section className="mx-auto max-w-[1000px] px-[26px] pb-[70px] pt-[30px] text-center">
        <p className="text-[22px] font-medium leading-[1.9]" style={{ color: '#D8CEE6' }}>{t.intro}</p>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-site px-[26px] pb-20">
        <div data-grid4 className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {t.stats.map((s, i) => (
            <div key={i} className="rounded-card border border-[var(--border)] bg-[var(--card-bg)] px-[22px] py-7 text-center">
              <div className="font-poppins text-[42px] font-bold text-accent-light">{s.n}</div>
              <div className="mt-1 text-[14.5px] text-muted">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="mx-auto max-w-site px-[26px] pb-20">
        <SectionHeader kicker={t.servicesKick} title={t.servicesTitle} />
        <div data-grid3 className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {services.map((s) => <ServiceCard key={s.id} service={s} />)}
        </div>
        <div className="mt-[30px] text-center">
          <Link to="/services" className="font-semibold text-accent-light">{t.servicesAll}</Link>
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section className="mx-auto max-w-site px-[26px] pb-[90px]">
        <SectionHeader kicker={t.featuredKick} title={t.featuredTitle} />
        <div data-grid3 className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {featured.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>

      <CTASection />
    </div>
  )
}
