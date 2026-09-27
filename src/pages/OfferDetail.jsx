import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'
import { toEmbedUrl } from '../lib/video'
import { toHttpUrl } from '../lib/url'
import Icon from '../components/Icon'
import PageTitle from '../components/PageTitle'
import Lightbox from '../components/Lightbox'
import OfferRequestModal from '../components/OfferRequestModal'

const CHECK = '<polyline points="20 6 9 17 4 12"/>'

function Heading({ children }) {
  return <h2 className="mb-6 text-[26px] font-bold">{children}</h2>
}

/** /offers/:slug — everything about one offer: the explanation, images, video, features and plans, plus
 * the two ways in: "Book now" (optionally for a given plan) and "Ask about this offer". */
export default function OfferDetail() {
  const { slug } = useParams()
  const { t, pick } = useLang()
  const [offer, setOffer] = useState(null)
  const [lb, setLb] = useState(null)
  // { type: 'booking' | 'inquiry', plan?: string } while the form is open
  const [form, setForm] = useState(null)

  useEffect(() => {
    setOffer(null)
    setForm(null)
    api.getOffer(slug).then(setOffer).catch(() => setOffer(false))
  }, [slug])

  if (offer === false) return <div className="mx-auto max-w-narrow px-[26px] py-24 text-center text-muted">{t.oNotFound}</div>
  if (!offer) return <div className="mx-auto max-w-narrow px-[26px] py-24 text-center text-muted">…</div>

  const title = pick(offer, 'title')
  const images = [offer.cover_image, ...(offer.gallery ?? [])].filter(Boolean)
  const gallery = offer.gallery ?? []
  const embedUrl = toEmbedUrl(offer.video_url)
  const videoHref = toHttpUrl(offer.video_url)
  const features = offer.features ?? []
  const plans = offer.plans ?? []
  const plansNote = pick(offer, 'plans_note')

  const book = (plan = '') => setForm({ type: 'booking', plan })
  const ask = () => setForm({ type: 'inquiry' })

  return (
    <div className="view-enter mx-auto max-w-site px-[26px] pb-[90px] pt-10">
      <PageTitle title={title} description={pick(offer, 'short')} />
      <Link to="/offers" className="mb-6 inline-flex items-center gap-2 text-[14px] text-accent-light">{t.oBack}</Link>

      {/* ================= HEADER ================= */}
      <div data-grid2 className="mb-14 grid items-center gap-10" style={{ gridTemplateColumns: '1.05fr .95fr' }}>
        <div>
          <div className="mb-3 font-mono text-[13px] text-accent-light">// {t.offersKick}</div>
          <h1 className="mb-4 text-[clamp(30px,5vw,44px)] font-extrabold leading-tight" dir="auto">{title}</h1>
          <p className="mb-7 text-[17px] leading-[1.8] text-soft" dir="auto">{pick(offer, 'short')}</p>
          <div className="flex flex-wrap gap-3.5">
            <button type="button" onClick={() => book()} className="btn-p rounded-xl bg-accent px-7 py-3.5 font-semibold text-white">{t.oBook}</button>
            <button type="button" onClick={ask} className="rounded-xl border border-white/20 px-7 py-3.5 font-semibold text-ink hover:bg-white/5">{t.oAsk}</button>
          </div>
        </div>
        {offer.cover_image && (
          <button type="button" onClick={() => setLb(0)} aria-label={title} className="overflow-hidden rounded-2xl border border-white/[.12]" style={{ aspectRatio: '16 / 10' }}>
            <img src={offer.cover_image} alt="" className="h-full w-full object-cover" />
          </button>
        )}
      </div>

      {/* ================= DESCRIPTION ================= */}
      <section className="mb-14 max-w-[860px]">
        <p className="whitespace-pre-line text-[16.5px] leading-[1.95] text-soft" dir="auto">{pick(offer, 'description')}</p>
      </section>

      {/* ================= PLANS ================= */}
      {/* Right after the description: the price is what a visitor looks for first. */}
      {plans.length > 0 && (
        <section className="mb-14">
          <Heading>{t.oPlans}</Heading>
          <div data-grid3 className="grid items-stretch gap-[18px]" style={{ gridTemplateColumns: `repeat(${Math.min(plans.length, 3)},1fr)` }}>
            {plans.map((plan, i) => {
              const name = pick(plan, 'name')
              return (
                <div key={i} className={`relative flex flex-col rounded-2xl border p-7 ${plan.highlighted ? 'border-accent-light' : 'border-[var(--border)]'}`}
                  style={{ background: plan.highlighted ? 'linear-gradient(160deg,rgba(107,78,142,.35),rgba(48,29,61,.4))' : 'var(--card-bg)' }}>
                  {plan.highlighted && (
                    <span className="absolute -top-3 start-6 rounded-full bg-accent px-3 py-1 text-[12px] font-semibold text-white">{t.oPopular}</span>
                  )}
                  <h3 className="mb-2 text-[19px] font-bold" dir="auto">{name}</h3>
                  {pick(plan, 'price') && <div className="mb-1 font-poppins text-[26px] font-bold ngp-grad" dir="auto">{pick(plan, 'price')}</div>}
                  {plan.duration_days > 0 && <div className="mb-4 text-[13.5px] text-muted">{t.oDays(plan.duration_days)}</div>}
                  {pick(plan, 'description') && <p className="mb-6 flex-1 whitespace-pre-line text-[14.5px] leading-[1.75] text-soft" dir="auto">{pick(plan, 'description')}</p>}
                  <button type="button" onClick={() => book(name)}
                    className={`mt-auto rounded-xl px-5 py-3 font-semibold ${plan.highlighted ? 'btn-p bg-accent text-white' : 'border border-white/20 text-ink hover:bg-white/5'}`}>
                    {t.oBookPlan}
                  </button>
                </div>
              )
            })}
          </div>
          {plansNote && <p className="mt-6 max-w-[860px] whitespace-pre-line text-[14.5px] leading-[1.8] text-muted" dir="auto">{plansNote}</p>}
        </section>
      )}

      {/* ================= VIDEO ================= */}
      {embedUrl ? (
        <section className="mb-14">
          <Heading>{t.dVideo}</Heading>
          <div className="overflow-hidden rounded-2xl border border-white/[.12]" style={{ aspectRatio: '16 / 9' }}>
            <iframe className="h-full w-full" src={embedUrl} title={title} allowFullScreen />
          </div>
        </section>
      ) : videoHref ? (
        <a href={videoHref} target="_blank" rel="noreferrer" className="glink mb-14 inline-flex items-center gap-2.5 rounded-xl border border-white/[.14] bg-white/[.03] px-5 py-2.5 text-[14px] text-[#D8CEE6]">
          {t.dVideoOpen}
        </a>
      ) : null}

      {/* ================= FEATURES ================= */}
      {features.length > 0 && (
        <section className="mb-14">
          <Heading>{t.oFeatures}</Heading>
          <div data-grid2 className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3.5 rounded-[14px] border border-[var(--border)] bg-white/[.02] p-[22px]">
                <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px]" style={{ background: 'linear-gradient(135deg,#6B4E8E,#9678BE)' }}>
                  <Icon path={CHECK} size={17} stroke="#fff" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="mb-1 text-[16px] font-semibold" dir="auto">{pick(feature, 'title')}</h3>
                  {pick(feature, 'description') && <p className="whitespace-pre-line text-[14px] leading-[1.65] text-muted" dir="auto">{pick(feature, 'description')}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= GALLERY ================= */}
      {gallery.length > 0 && (
        <section className="mb-14">
          <Heading>{t.dGallery}</Heading>
          <div data-grid3 className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {gallery.map((src, i) => (
              <button key={src} type="button" onClick={() => setLb(images.indexOf(src))} aria-label={`${title} ${i + 1}`} className="overflow-hidden rounded-xl border border-white/[.12]" style={{ aspectRatio: '4 / 3' }}>
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ================= CALL TO ACTION ================= */}
      <div className="mt-12 flex flex-wrap justify-center gap-3.5">
        <button type="button" onClick={() => book()} className="btn-p rounded-xl bg-accent px-8 py-3.5 font-semibold text-white">{t.oBook}</button>
        <button type="button" onClick={ask} className="rounded-xl border border-white/20 px-8 py-3.5 font-semibold text-ink hover:bg-white/5">{t.oAsk}</button>
      </div>

      {lb !== null && images[lb] && <Lightbox src={images[lb]} label={`${title} ${lb + 1}`} onClose={() => setLb(null)} />}
      {form && <OfferRequestModal offer={offer} type={form.type} plan={form.plan} onClose={() => setForm(null)} />}
    </div>
  )
}
