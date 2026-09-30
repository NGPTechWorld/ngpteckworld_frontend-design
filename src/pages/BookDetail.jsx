import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'
import { toHttpUrl } from '../lib/url'
import Icon from '../components/Icon'
import PageTitle from '../components/PageTitle'
import Skeleton from '../components/fx/Skeleton'
import { BOOK_ICON, BookCover, EYE_ICON } from './Library'

const DOWNLOAD_ICON = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'

/** "3.4 MB" / "820 KB". */
export function fileSize(bytes) {
  if (!bytes) return ''
  return bytes >= 1024 * 1024 ? `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** The page's own layout while the book loads: cover, title, author, the two buttons and the description. */
function BookDetailSkeleton() {
  return (
    <div className="mx-auto max-w-site px-[26px] pb-[90px] pt-10" aria-busy="true">
      <Skeleton className="mb-8 h-[14px] w-36" />
      <div data-grid2 className="grid items-start gap-10" style={{ gridTemplateColumns: 'minmax(0, 300px) 1fr' }}>
        <Skeleton className="mx-auto w-full max-w-[300px] !rounded-2xl" style={{ aspectRatio: '3 / 4' }} />
        <div>
          <Skeleton className="mb-4 h-[12px] w-28" />
          <Skeleton className="mb-3 h-[36px] w-3/4" />
          <Skeleton className="mb-6 h-[16px] w-1/3" />
          <Skeleton className="mb-8 h-[14px] w-40" />
          <div className="mb-9 flex gap-3.5">
            <Skeleton className="h-[50px] w-44 !rounded-xl" />
            <Skeleton className="h-[50px] w-44 !rounded-xl" />
          </div>
          {['w-full', 'w-full', 'w-11/12', 'w-4/5', 'w-2/3'].map((w, i) => <Skeleton key={i} className={`mb-3 h-[14px] ${w}`} />)}
        </div>
      </div>
    </div>
  )
}

/** /library/:slug — a book's cover, description and details, with "Read the book" and "Download". */
export default function BookDetail() {
  const { slug } = useParams()
  const { t, pick } = useLang()
  const [book, setBook] = useState(null)

  useEffect(() => {
    setBook(null)
    api.getBook(slug).then(setBook).catch(() => setBook(false))
  }, [slug])

  if (book === false) return <div className="mx-auto max-w-narrow px-[26px] py-24 text-center text-muted">{t.libNotFound}</div>
  if (!book) return <BookDetailSkeleton />


  const title = pick(book, 'title')
  const downloadHref = toHttpUrl(book.download_url)
  const details = [
    [t.libAuthor, pick(book, 'author')],
    [t.libCategory, pick(book, 'category')],
    [t.libLanguage, pick(book, 'language')],
    [t.libPages, book.pages],
    [t.libYear, book.year],
    [t.libSize, fileSize(book.file_size)],
  ].filter(([, value]) => value)

  return (
    <div className="view-enter mx-auto max-w-site px-[26px] pb-[90px] pt-10">
      <PageTitle title={title} description={pick(book, 'description')} />
      <Link to="/library" className="mb-8 inline-flex items-center gap-2 text-[14px] text-accent-light">{t.libBack}</Link>

      <div data-grid2 className="grid items-start gap-10" style={{ gridTemplateColumns: 'minmax(0, 300px) 1fr' }}>
        <BookCover book={book} className="mx-auto w-full max-w-[300px] rounded-2xl border border-white/[.12] shadow-cardhover" />

        <div>
          <div className="mb-3 font-mono text-[13px] text-accent-light">// {t.libKick}</div>
          <h1 className="mb-2 text-[clamp(28px,4.5vw,40px)] font-extrabold leading-tight" dir="auto">{title}</h1>
          {pick(book, 'author') && <p className="mb-4 text-[17px] text-soft" dir="auto">{pick(book, 'author')}</p>}

          <div className="mb-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-muted">
            <span className="inline-flex items-center gap-1.5"><Icon path={EYE_ICON} size={15} stroke="#9678BE" />{t.libReaders(book.reads_count ?? 0)}</span>
            {downloadHref && <span className="inline-flex items-center gap-1.5"><Icon path={DOWNLOAD_ICON} size={15} stroke="#9678BE" />{t.libDownloads(book.downloads_count ?? 0)}</span>}
          </div>

          <div className="mb-9 flex flex-wrap gap-3.5">
            <Link to={`/library/${book.slug}/read`} className="btn-p inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 font-semibold text-white">
              <Icon path={BOOK_ICON} size={17} stroke="#fff" />
              {t.libRead}
            </Link>
            {downloadHref && (
              <a href={downloadHref} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 font-semibold text-ink hover:bg-white/5">
                <Icon path={DOWNLOAD_ICON} size={17} stroke="currentColor" />
                {t.libDownload}
              </a>
            )}
          </div>

          <p className="mb-9 whitespace-pre-line text-[16px] leading-[1.95] text-soft" dir="auto">{pick(book, 'description')}</p>

          {details.length > 0 && (
            <section>
              <h2 className="mb-4 text-[20px] font-bold">{t.libDetails}</h2>
              <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {details.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-white/[.07] pb-2.5 text-[14.5px]">
                    <dt className="text-muted">{label}</dt>
                    <dd className="text-end font-medium text-ink" dir="auto">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
