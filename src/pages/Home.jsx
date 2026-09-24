import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { pickFeatured } from '../lib/projects'
import { useLang } from '../i18n/LanguageContext'
import { useSpotlight } from '../lib/useSpotlight'
import { useSections } from '../lib/SiteSettings'
import Button from '../components/Button'
import SectionHeader from '../components/SectionHeader'
import ServiceCard from '../components/ServiceCard'
import ProjectCard from '../components/ProjectCard'
import CTASection from '../components/CTASection'
import ProcessSteps from '../components/ProcessSteps'
import Testimonials from '../components/Testimonials'
import Partners from '../components/Partners'
import FaqAccordion from '../components/FaqAccordion'
import PageTitle from '../components/PageTitle'
import LogoNova from '../components/fx/LogoNova'
import CountUp from '../components/fx/CountUp'
import Skeleton, { SkeletonGrid } from '../components/fx/Skeleton'


function StatCard({ stat }) {
  const spot = useSpotlight()
  return (
    <div ref={spot} data-rise className="ngp-card px-5 py-7 text-center sm:px-6 sm:py-8">
      <span className="ngp-bracket ngp-bracket--tl" />
      <span className="ngp-bracket ngp-bracket--br" />
      <div className="font-poppins text-[clamp(30px,6vw,46px)] font-bold leading-none tracking-tight">
        <CountUp value={stat.n} className="ngp-grad" />
      </div>
      <div className="mt-3 text-[13.5px] leading-snug text-muted">{stat.l}</div>
    </div>
  )
}

export default function Home() {
  const { t, pick } = useLang()
  const shown = useSections()
  const [services, setServices] = useState([])
  const [featured, setFeatured] = useState([])
  const [stats, setStats] = useState(null)
  // Tracked separately from the arrays: an empty array is ambiguous — it means both "still
  // fetching" and "the dashboard has none", and those need different things on screen.
  const [loading, setLoading] = useState({ services: true, projects: true })
  const [promoReady, setPromoReady] = useState(false)

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {})
    api.getServices()
      .then((s) => setServices(s.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading((l) => ({ ...l, services: false })))
    api.getProjects()
      .then((p) => setFeatured(pickFeatured(p)))
      .catch(() => {})
      .finally(() => setLoading((l) => ({ ...l, projects: false })))
  }, [])

  // Prefer dashboard-managed stats; fall back to the static dictionary.
  const statList = stats && stats.length
    ? stats.map((s) => ({ n: s.value, l: pick(s, 'label') }))
    : t.stats

  return (
    <div className="view-enter">
      <PageTitle title={t.navHome} description={t.heroSub} />

      {/* ================= HERO ================= */}
      <section data-hero className="relative overflow-hidden">
        <div className="relative z-[1] mx-auto max-w-site px-[26px] pb-[clamp(36px,5vw,64px)] pt-[clamp(20px,4vw,104px)]">
          <div className="max-w-[660px]">
            <div className="ngp-hero-item mb-7" style={{ '--i': 0 }}>
              <span className="inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-[12.5px] text-soft backdrop-blur-sm"
                style={{ borderColor: 'rgba(150,120,190,.35)', background: 'rgba(48,29,61,.4)' }}>
                <span className="relative flex h-[7px] w-[7px]">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: '#9678BE' }} />
                  <span className="relative inline-flex h-[7px] w-[7px] rounded-full" style={{ background: '#C5B2E0' }} />
                </span>
                {t.heroBadge}
              </span>
            </div>

            <h1 className="ngp-fluid ngp-hero-item mb-6 text-[clamp(34px,7.4vw,66px)] font-extrabold leading-[1.08] tracking-[-0.02em]" style={{ '--i': 1 }}>
              {t.heroT1} <span className="ngp-grad">{t.heroAccent}</span>
            </h1>

            <p className="ngp-hero-item mb-9 max-w-[520px] text-[clamp(15px,2.4vw,18px)] leading-[1.8] text-muted" style={{ '--i': 2 }}>
              {t.heroSub}
            </p>

            <div className="ngp-hero-item flex flex-wrap gap-3.5" style={{ '--i': 3 }}>
              <Button to="/contact">{t.heroCta1}</Button>
              {shown('portfolio_page') && <Button to="/portfolio" variant="outline">{t.heroCta2}</Button>}
            </div>
          </div>

        </div>

        {/* Placed after the copy in the DOM on purpose. On a phone .ngp-hero-visual is in
            normal flow, so this is what puts it *below* the headline rather than above it. From
            the lg breakpoint up the same element is position:absolute and sits in the outer
            corner, where source order has no bearing on where it lands — the copy stays on top
            via z-index, not ordering. */}
        <div className="ngp-hero-visual ngp-globe-in z-0">
          <LogoNova className="h-full w-full" />
        </div>
      </section>

      {/* Every section below can be switched off from the dashboard (Site settings → Website sections). */}

      {/* ================= INTRO ================= */}
      {shown('intro') && (
      <section className="ngp-section relative pt-[clamp(24px,4vw,48px)] text-center" style={{ maxWidth: 900 }}>
        <p data-rise className="text-[clamp(17px,3vw,25px)] font-medium leading-[1.85]" style={{ color: '#D8CEE6' }}>
          {t.intro}
        </p>
      </section>
      )}

      {/* ================= STATS ================= */}
      {shown('stats') && (
      <section className="ngp-section">
        {/* auto-fit rather than a fixed column count: the dashboard decides how many stats there
            are, and a hard `lg:grid-cols-4` left a fifth one stranded alone on its own row. */}
        <div
          data-stagger
          className="grid gap-3.5 sm:gap-[18px]"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 20vw, 190px), 1fr))' }}
        >
          {statList.map((s, i) => <StatCard key={i} stat={s} />)}
        </div>
      </section>
      )}

      {/* ================= SERVICES ================= */}
      {shown('services') && (
      <section className="ngp-section">
        <SectionHeader
          kicker={t.servicesKick}
          title={t.servicesTitle}
          sub={t.servicesSub}
          action={shown('services_page') && (
            <Link to="/services" className="ngp-kicker shrink-0 pb-2 transition-opacity hover:opacity-70">
              {t.servicesAll}
            </Link>
          )}
        />
        <div data-stagger className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {loading.services
            ? <SkeletonGrid count={3} />
            : services.map((s, i) => (
              <div key={s.id} data-rise className="h-full">
                <ServiceCard service={s} index={i} />
              </div>
            ))}
        </div>
      </section>
      )}

      {/* ================= PROCESS ================= */}
      {shown('process') && <ProcessSteps />}

      {/* ================= FEATURED WORK ================= */}
      {/* the cards open project pages, so the section also goes when the portfolio is hidden */}
      {shown('featured') && shown('portfolio_page') && (
      <section className="ngp-section">
        <SectionHeader kicker={t.featuredKick} title={t.featuredTitle} />
        <div data-stagger className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {loading.projects
            ? <SkeletonGrid count={3} variant="project" />
            : featured.map((p) => (
              <div key={p.id} data-rise className="h-full">
                <ProjectCard project={p} />
              </div>
            ))}
        </div>
      </section>
      )}

      {/* ================= PROMO ================= */}
      {shown('promo') && (
      <section className="ngp-section">
        <div className="ngp-card mx-auto w-full overflow-hidden" style={{ maxWidth: 1280 }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
            {/* The promo is a self-contained HTML document, heavy enough that the frame is blank
                for a noticeable beat. The placeholder sits above it and is removed on load, so the
                slot never shows as an empty black rectangle. */}
            {!promoReady && (
              <div className="absolute inset-0 grid place-items-center">
                <Skeleton className="!rounded-none absolute inset-0" />
                <div className="relative flex flex-col items-center gap-3">
                  <span className="ngp-spinner" />
                  <span className="font-mono text-[10.5px] uppercase tracking-[.2em] text-faint">
                    {t.loadingLabel}
                  </span>
                </div>
              </div>
            )}
            <iframe
              src="/ngp-promo-embed.html"
              title="NGP TechWorld Promo"
              loading="lazy"
              scrolling="no"
              allowFullScreen
              onLoad={() => setPromoReady(true)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, overflow: 'hidden' }}
            />
          </div>
        </div>
      </section>
      )}

      {/* The call to action sits here, straight after the work, rather than at the very bottom:
          it lands while the projects are still in mind, and the testimonials, partners and FAQ
          that follow go on answering the visitor who is not ready to act yet. */}
      {shown('cta') && <CTASection />}
      {shown('testimonials') && <Testimonials />}
      {shown('partners') && <Partners />}
      {shown('faq') && <FaqAccordion />}
    </div>
  )
}
