import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { openPdf } from '../lib/pdf'
import { useLang } from '../i18n/LanguageContext'
import { toHttpUrl } from '../lib/url'
import Icon from '../components/Icon'
import PageTitle from '../components/PageTitle'

const ZOOMS = [0.6, 0.75, 0.9, 1, 1.25, 1.5, 2]
const READ_KEY = (slug) => `ngp.read.${slug}`

/**
 * Counts this browser as a reader of the book once. The flag is kept in localStorage, so a refresh or a
 * second visit does not count again (the API throttles too); a private window may count twice, which is fine.
 */
function useCountReader(slug, ready) {
  useEffect(() => {
    if (!ready) return
    let counted = false
    try { counted = localStorage.getItem(READ_KEY(slug)) === '1' } catch { /* storage blocked */ }
    if (counted) return
    api.readBook(slug).then(() => { try { localStorage.setItem(READ_KEY(slug), '1') } catch { /* ignore */ } }).catch(() => {})
  }, [slug, ready])
}

/**
 * One page, drawn into a canvas only once it comes near the screen (a 300-page book must not render 300
 * canvases up front). Until then a box of the right height keeps the scroll position honest.
 */
function PdfPage({ doc, number, width, ratio, onVisible }) {
  const box = useRef(null)
  const canvas = useRef(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return undefined }
    const nearby = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNear(true) }, { rootMargin: '1200px 0px' })
    const current = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) onVisible(number) }, { threshold: 0.5 })
    nearby.observe(el)
    current.observe(el)
    return () => { nearby.disconnect(); current.disconnect() }
  }, [number, onVisible])

  useEffect(() => {
    if (!near || !width) return undefined
    let task = null
    let cancelled = false
    doc.getPage(number).then((page) => {
      if (cancelled || !canvas.current) return
      const base = page.getViewport({ scale: 1 })
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const viewport = page.getViewport({ scale: (width / base.width) * dpr })
      const el = canvas.current
      el.width = Math.floor(viewport.width)
      el.height = Math.floor(viewport.height)
      el.style.width = `${width}px`
      el.style.height = `${Math.floor(viewport.height / dpr)}px`
      task = page.render({ canvasContext: el.getContext('2d'), viewport })
      task.promise.catch(() => {}) // a cancelled render rejects; that is expected
    }).catch(() => {})
    return () => { cancelled = true; task?.cancel() }
  }, [doc, number, width, near])

  return (
    <div ref={box} data-page={number} className="mx-auto overflow-hidden rounded-md bg-white shadow-cardhover" style={{ width, minHeight: Math.round(width * ratio) }}>
      <canvas ref={canvas} aria-label={`${number}`} />
    </div>
  )
}

/** /library/:slug/read — the book read on our own site: every page rendered by pdf.js, with zoom and a page counter. */
export default function BookReader() {
  const { slug } = useParams()
  const { t, pick } = useLang()
  const [book, setBook] = useState(null)
  const [doc, setDoc] = useState(null)
  const [failed, setFailed] = useState(false)
  const [ratio, setRatio] = useState(1.414) // A4 until the first page tells us better
  const [zoomIndex, setZoomIndex] = useState(ZOOMS.indexOf(1))
  const [current, setCurrent] = useState(1)
  const [width, setWidth] = useState(0)
  const frame = useRef(null)
  // the toolbar sticks right under the site's (sticky) navbar, whatever height it has on this screen
  const [navHeight, setNavHeight] = useState(64)
  useEffect(() => {
    const nav = document.querySelector('nav')
    if (nav) setNavHeight(nav.getBoundingClientRect().height)
  }, [])

  useEffect(() => {
    let alive = true
    setBook(null); setDoc(null); setFailed(false); setCurrent(1)
    api.getBook(slug)
      .then((data) => {
        if (!alive) return null
        setBook(data)
        return openPdf(data.file_url).then(async (pdf) => {
          const first = await pdf.getPage(1)
          const viewport = first.getViewport({ scale: 1 })
          if (!alive) return
          setRatio(viewport.height / viewport.width)
          setDoc(pdf)
        })
      })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [slug])

  useCountReader(slug, Boolean(doc))

  // The page width follows the reading column, up to a comfortable maximum, times the zoom.
  useEffect(() => {
    const el = frame.current
    if (!el) return undefined
    const measure = () => setWidth(Math.min(el.clientWidth, 900))
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [doc])

  const onVisible = useCallback((n) => setCurrent(n), [])
  const zoom = ZOOMS[zoomIndex]
  const pageWidth = Math.round(width * zoom)
  const title = book ? pick(book, 'title') : ''
  const downloadHref = toHttpUrl(book?.download_url)

  if (failed && !book) return <div className="mx-auto max-w-narrow px-[26px] py-24 text-center text-muted">{t.libNotFound}</div>

  return (
    <div className="view-enter">
      {book && <PageTitle title={title} description={pick(book, 'description')} />}

      <div className="sticky z-40 border-b border-[var(--border)]" style={{ top: navHeight, backdropFilter: 'blur(14px)', background: 'rgba(26,15,38,.85)' }}>
        <div className="mx-auto flex max-w-site flex-wrap items-center gap-x-4 gap-y-2 px-[18px] py-2.5">
          <Link to={`/library/${slug}`} className="shrink-0 text-[14px] text-accent-light">{t.readerBack}</Link>
          <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold" dir="auto">{title}</h1>
          {doc && <span className="text-[13px] text-muted" aria-live="polite">{t.readerPage(current, doc.numPages)}</span>}
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setZoomIndex((i) => Math.max(0, i - 1))} disabled={zoomIndex === 0} aria-label={t.readerZoomOut}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-ink disabled:opacity-40">−</button>
            <span className="w-12 text-center text-[13px] tabular-nums text-soft">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoomIndex((i) => Math.min(ZOOMS.length - 1, i + 1))} disabled={zoomIndex === ZOOMS.length - 1} aria-label={t.readerZoomIn}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-ink disabled:opacity-40">+</button>
          </div>
          {downloadHref && (
            <a href={downloadHref} className="btn-p rounded-lg bg-accent px-4 py-2 text-[13.5px] font-semibold text-white">{t.libDownload}</a>
          )}
        </div>
      </div>

      <div className="overflow-x-auto px-3 py-6 sm:px-[26px]">
        <div ref={frame} className="mx-auto max-w-[900px]">
          {failed ? (
            <p role="alert" className="py-24 text-center text-muted">{t.readerError}</p>
          ) : !doc ? (
            <div role="status" className="flex flex-col items-center gap-3 py-24 text-muted">
              <span className="ngp-spinner" />
              <span className="text-[14px]">{t.readerLoading}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4" style={{ width: pageWidth > width ? pageWidth : undefined }}>
              {Array.from({ length: doc.numPages }, (_, i) => (
                <PdfPage key={i + 1} doc={doc} number={i + 1} width={pageWidth} ratio={ratio} onVisible={onVisible} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
