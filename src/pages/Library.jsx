import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'
import { useSpotlight } from '../lib/useSpotlight'
import SectionHeader from '../components/SectionHeader'
import PageTitle from '../components/PageTitle'
import Icon from '../components/Icon'
import { SkeletonGrid } from '../components/fx/Skeleton'

export const BOOK_ICON = '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'
export const EYE_ICON = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'

/** A book's cover, or a placeholder in the brand colours with its title. */
export function BookCover({ book, className = '' }) {
  const { pick } = useLang()
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: '3 / 4', background: 'linear-gradient(160deg,#6B4E8E,#301D3D)' }}>
      {book.cover_image ? (
        <img src={book.cover_image} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
          <Icon path={BOOK_ICON} size={34} stroke="#C5B2E0" />
          <span className="line-clamp-3 text-[15px] font-semibold text-white/85" dir="auto">{pick(book, 'title')}</span>
        </div>
      )}
    </div>
  )
}

function BookCard({ book }) {
  const { t, pick } = useLang()
  const spot = useSpotlight()

  return (
    <Link ref={spot} to={`/library/${book.slug}`} data-rise className="ngp-card group flex h-full flex-col overflow-hidden">
      <span className="ngp-bracket ngp-bracket--tl" />
      <span className="ngp-bracket ngp-bracket--br" />
      <div className="overflow-hidden">
        <div className="transition-transform duration-[700ms] ease-[cubic-bezier(.22,.75,.25,1)] group-hover:scale-[1.04]">
          <BookCover book={book} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="mb-1 line-clamp-2 text-[16.5px] font-bold leading-snug" dir="auto">{pick(book, 'title')}</h2>
        {pick(book, 'author') && <p className="mb-3 truncate text-[13.5px] text-muted" dir="auto">{pick(book, 'author')}</p>}
        <p className="mt-auto inline-flex items-center gap-1.5 text-[13px] text-accent-light">
          <Icon path={EYE_ICON} size={14} stroke="currentColor" />
          {t.libReaders(book.reads_count ?? 0)}
        </p>
      </div>
    </Link>
  )
}

/** /library — the books as cards (cover, title, author, readers); each opens its own page. */
export default function Library() {
  const { t } = useLang()
  const [books, setBooks] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => { api.getBooks().then(setBooks).catch(() => { setBooks([]); setFailed(true) }) }, [])

  return (
    <div className="view-enter mx-auto max-w-site px-[26px] pb-[90px] pt-[70px]">
      <PageTitle title={t.libTitle} description={t.libSub} />
      <SectionHeader as="h1" kicker={t.libKick} title={t.libTitle} sub={t.libSub} />
      {failed && <p role="status" className="py-10 text-center text-muted">{t.loadError}</p>}
      {!failed && books?.length === 0 && <p className="py-10 text-center text-muted">{t.libEmpty}</p>}
      <div data-stagger className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(150px, 42vw, 210px), 1fr))' }}>
        {books === null ? <SkeletonGrid count={4} /> : books.map((book) => <BookCard key={book.id} book={book} />)}
      </div>
    </div>
  )
}
