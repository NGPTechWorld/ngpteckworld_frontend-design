/**
 * Loading placeholders.
 *
 * Each one is built to the same footprint as the real card it stands in for. That is the point:
 * a section that collapses to nothing while it loads and then springs open shoves everything
 * below it down the moment the data lands, which is far more jarring than a brief grey block.
 *
 * Decorative, so they are hidden from assistive technology — the live region that matters is the
 * content that replaces them.
 */

export function Skeleton({ className = '', style }) {
  return <div className={'ngp-skel ' + className} style={style} aria-hidden="true" />
}

/** Matches ServiceCard: hex icon, title, two lines of copy, a rule and three feature rows. */
export function SkeletonServiceCard() {
  return (
    <div className="ngp-card flex h-full flex-col p-7 sm:p-8" aria-hidden="true">
      <Skeleton className="mb-6 h-[64px] w-[58px] !rounded-[14px]" />
      <Skeleton className="mb-3 h-[19px] w-2/3" />
      <Skeleton className="mb-2 h-[13px] w-full" />
      <Skeleton className="mb-5 h-[13px] w-5/6" />
      <div className="mt-auto flex flex-col gap-3 border-t border-white/[.07] pt-5">
        <Skeleton className="h-[12px] w-4/5" />
        <Skeleton className="h-[12px] w-3/5" />
        <Skeleton className="h-[12px] w-2/3" />
      </div>
    </div>
  )
}

/** Matches ProjectCard: 16:9 cover, category chip, title, one line of copy. */
export function SkeletonProjectCard() {
  return (
    <div className="ngp-card h-full overflow-hidden" aria-hidden="true">
      <Skeleton className="!rounded-none" style={{ aspectRatio: '16 / 10' }} />
      <div className="p-6">
        <Skeleton className="mb-3 h-[11px] w-20" />
        <Skeleton className="mb-3 h-[18px] w-3/4" />
        <Skeleton className="h-[13px] w-full" />
      </div>
    </div>
  )
}

/** Matches the Offers card: 16:10 image, title, two lines of copy, the "View details" link. */
export function SkeletonOfferCard() {
  return (
    <div className="ngp-card flex h-full flex-col overflow-hidden" aria-hidden="true">
      <Skeleton className="!rounded-none" style={{ aspectRatio: '16 / 10' }} />
      <div className="flex flex-1 flex-col p-6">
        <Skeleton className="mb-3 h-[19px] w-2/3" />
        <Skeleton className="mb-2 h-[13px] w-full" />
        <Skeleton className="mb-5 h-[13px] w-4/5" />
        <Skeleton className="mt-auto h-[12px] w-24" />
      </div>
    </div>
  )
}

/** Matches the Library card: 3:4 cover, a two-line title, the author and the readers line. */
export function SkeletonBookCard() {
  return (
    <div className="ngp-card flex h-full flex-col overflow-hidden" aria-hidden="true">
      <Skeleton className="!rounded-none" style={{ aspectRatio: '3 / 4' }} />
      <div className="flex flex-1 flex-col p-5">
        <Skeleton className="mb-2 h-[16px] w-11/12" />
        <Skeleton className="mb-3 h-[16px] w-2/3" />
        <Skeleton className="mb-3 h-[12px] w-1/2" />
        <Skeleton className="mt-auto h-[12px] w-20" />
      </div>
    </div>
  )
}

const CARDS = { service: SkeletonServiceCard, project: SkeletonProjectCard, offer: SkeletonOfferCard, book: SkeletonBookCard }

/** A row of `count` skeletons, wrapped so it drops straight into the same grid as the real cards. */
export function SkeletonGrid({ count = 3, variant = 'service' }) {
  const Card = CARDS[variant] ?? SkeletonServiceCard
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-full">
          <Card />
        </div>
      ))}
    </>
  )
}

export default Skeleton
