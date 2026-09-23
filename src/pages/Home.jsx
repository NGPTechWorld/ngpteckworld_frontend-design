import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { pickFeatured } from '../lib/projects'
import { useLang } from '../i18n/LanguageContext'
import { useSpotlight } from '../lib/useSpotlight'
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
import TechGlobe from '../components/fx/TechGlobe'
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

      {/* ================= HERO =================
          The globe is absolutely positioned and bleeds off the top-right (top-left in RTL) rather
          than sitting in its own grid column. A column would force the copy to shrink on every
          breakpoint to keep it company; letting it overlap means the text keeps a comfortable
          measure and the globe simply crops. */}
      <section data-hero className="relative overflow-hidden">
        {/* Pulled only slightly off the outer edge: far enough that the sphere reads as bigger
            than the viewport, close enough that the continents — not an empty limb — are what
            actually shows. The bottom is masked rather than cropped so it dissolves into the
            section below instead of ending on a hard edge. */}
        <div
          className="ngp-globe-in pointer-events-none absolute z-0"
          style={{
            insetInlineEnd: 'clamp(-18%, -6vw, -2%)',
            top: 'clamp(-90px, -5vw, -24px)',
            width: 'clamp(360px, 54vw, 700px)',
            height: 'clamp(360px, 54vw, 700px)',
          }}
        >
          {/* The mask lives on this inner wrapper, not the outer one, so it fades the globe's
              bottom edge without also fading the mark sitting on top of it. */}
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, #000 58%, transparent 94%)',
              maskImage: 'linear-gradient(to bottom, #000 58%, transparent 94%)',
            }}
          >
            <TechGlobe className="h-full w-full" />
          </div>

          {/* The mark, centred on the globe. Its own glow disc separates it from the dot field
              underneath — without it the logo's strokes and the continents read as one texture. */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative grid place-items-center" style={{ width: '54%', height: '54%' }}>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(20,11,30,.95) 30%, rgba(20,11,30,.6) 52%, transparent 74%)',
                }}
              />
              <div
                className="absolute rounded-full border border-dashed"
                style={{
                  inset: '-14%',
                  borderColor: 'rgba(197,178,224,.32)',
                  animation: 'ngpRot 48s linear infinite',
                }}
              />
              <div
                className="absolute rounded-full border"
                style={{
                  inset: '4%',
                  borderColor: 'rgba(150,120,190,.22)',
                  animation: 'ngpRot 34s linear infinite reverse',
                  borderStyle: 'dotted',
                }}
              />
              <img
                src="/assets/ngp-mark-white.png"
                alt=""
                className="relative w-[46%]"
                style={{
                  animation: 'ngpFloat 7s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 14px rgba(150,120,190,.38)) drop-shadow(0 0 34px rgba(107,78,142,.22))',
                }}
              />
            </div>
          </div>
        </div>

        <div className="relative z-[1] mx-auto max-w-site px-[26px] pb-[clamp(36px,5vw,64px)] pt-[clamp(56px,8vw,104px)]">
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
              <Button to="/portfolio" variant="outline">{t.heroCta2}</Button>
            </div>
          </div>

        </div>
      </section>

      {/* ================= INTRO ================= */}
      <section className="ngp-section relative pt-[clamp(24px,4vw,48px)] text-center" style={{ maxWidth: 900 }}>
        <p data-rise className="text-[clamp(17px,3vw,25px)] font-medium leading-[1.85]" style={{ color: '#D8CEE6' }}>
          {t.intro}
        </p>
      </section>

      {/* ================= STATS ================= */}
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

      {/* ================= SERVICES ================= */}
      <section className="ngp-section">
        <SectionHeader
          kicker={t.servicesKick}
          title={t.servicesTitle}
          sub={t.servicesSub}
          action={
            <Link to="/services" className="ngp-kicker shrink-0 pb-2 transition-opacity hover:opacity-70">
              {t.servicesAll}
            </Link>
          }
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

      {/* ================= PROCESS ================= */}
      <ProcessSteps />

      {/* ================= FEATURED WORK ================= */}
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

      {/* ================= PROMO ================= */}
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

      <Testimonials />
      <Partners />
      <FaqAccordion />
      <CTASection />
    </div>
  )
}
