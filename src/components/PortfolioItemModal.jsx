import { useEffect, useState } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { toEmbedUrl } from '../lib/video'
import { toHttpUrl } from '../lib/url'
import Lightbox from './Lightbox'

/** Fixed template for one portfolio item: title, optional video, description, and a click-to-zoom
 * image gallery (cover + gallery, in that order) — the same shape for every team member. */
export default function PortfolioItemModal({ item, onClose }) {
  const { pick, t } = useLang()
  const [lb, setLb] = useState(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const title = pick(item, 'title')
  const description = pick(item, 'description')
  const images = [item.cover_image, ...(item.gallery ?? [])].filter(Boolean)
  const embedUrl = toEmbedUrl(item.video_url)
  const videoHref = toHttpUrl(item.video_url)

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-6"
      style={{ background: 'rgba(10,6,16,.9)', backdropFilter: 'blur(6px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[760px] rounded-2xl border border-white/[.12] p-7"
        style={{ background: 'linear-gradient(180deg,#241636,#1A0F26)', maxHeight: '85vh', overflowY: 'auto' }}
      >
        <h3 className="mb-4 text-[24px] font-bold">{title}</h3>

        {embedUrl ? (
          <div className="mb-5 overflow-hidden rounded-xl border border-white/[.12]" style={{ aspectRatio: '16/9' }}>
            <iframe className="h-full w-full" src={embedUrl} title={title} allowFullScreen />
          </div>
        ) : videoHref ? (
          <a href={videoHref} target="_blank" rel="noreferrer"
            className="glink mb-5 inline-flex items-center gap-2.5 rounded-xl border border-white/[.14] bg-white/[.03] px-5 py-2.5 text-[14px] text-[#D8CEE6]">
            {t.dVideoOpen}
          </a>
        ) : null}

        <p dir="auto" className="mb-5 whitespace-pre-wrap text-[15.5px] leading-relaxed text-soft">{description}</p>

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setLb(i)}
                aria-label={`${title} ${i + 1}`}
                className="overflow-hidden rounded-lg border border-white/[.12]"
                style={{ aspectRatio: '4/3' }}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lb !== null && <Lightbox src={images[lb]} label={`${title} ${lb + 1}`} onClose={() => setLb(null)} />}
    </div>
  )
}
