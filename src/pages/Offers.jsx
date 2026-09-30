import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'
import { useSpotlight } from '../lib/useSpotlight'
import SectionHeader from '../components/SectionHeader'
import PageTitle from '../components/PageTitle'
import Icon from '../components/Icon'
import { SkeletonGrid } from '../components/fx/Skeleton'

const GIFT = '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>'

function OfferCard({ offer }) {
  const { t, pick } = useLang()
  const spot = useSpotlight()
  const title = pick(offer, 'title')

  return (
    <Link ref={spot} to={`/offers/${offer.slug}`} data-rise className="ngp-card group flex h-full flex-col overflow-hidden">
      <span className="ngp-bracket ngp-bracket--tl" />
      <span className="ngp-bracket ngp-bracket--br" />
      <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 10', background: 'linear-gradient(135deg,#6B4E8E,#301D3D)' }}>
        {offer.cover_image ? (
          <img src={offer.cover_image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[700ms] ease-[cubic-bezier(.22,.75,.25,1)] group-hover:scale-[1.06]" />
        ) : (
          <div className="flex h-full items-center justify-center"><Icon path={GIFT} size={40} stroke="#C5B2E0" /></div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h2 className="mb-2 text-[19px] font-bold" dir="auto">{title}</h2>
        <p className="mb-5 flex-1 text-[14.5px] leading-[1.75] text-muted" dir="auto">{pick(offer, 'short')}</p>
        <span className="ngp-kicker text-[13px] transition-opacity group-hover:opacity-70">{t.offerView}</span>
      </div>
    </Link>
  )
}

/** /offers — the subscription products as cards; each opens its own page with the details and the booking form. */
export default function Offers() {
  const { t } = useLang()
  const [offers, setOffers] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => { api.getOffers().then(setOffers).catch(() => { setOffers([]); setFailed(true) }) }, [])

  return (
    <div className="view-enter mx-auto max-w-site px-[26px] pb-[90px] pt-[70px]">
      <PageTitle title={t.offersTitle} description={t.offersSub} />
      <SectionHeader as="h1" kicker={t.offersKick} title={t.offersTitle} sub={t.offersSub} />
      {failed && <p role="status" className="py-10 text-center text-muted">{t.loadError}</p>}
      {!failed && offers?.length === 0 && <p className="py-10 text-center text-muted">{t.offersEmpty}</p>}
      <div data-grid3 data-stagger className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {offers === null ? <SkeletonGrid count={3} variant="offer" /> : offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
      </div>
    </div>
  )
}
