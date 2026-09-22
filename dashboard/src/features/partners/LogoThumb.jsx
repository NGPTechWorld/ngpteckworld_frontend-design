import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { cx } from '@/lib/cx'

/**
 * Small logo tile for list rows. Logos are shown whole (`object-contain`, unlike Avatar's cropping) on a light
 * tile so dark logos stay visible; a missing or broken image falls back to a neutral building icon.
 * The partner's name always sits next to it, so the image itself is decorative (empty alt).
 * Give it `key={src}` when the source can change, so a previous load failure does not stick.
 */
export function LogoThumb({ src, className }) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed
  return (
    <span className={cx('inline-flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[.12] p-1', showImage ? 'bg-white/90' : 'bg-white/[.06]', className)}>
      {showImage ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="max-h-full max-w-full object-contain" />
      ) : (
        <Building2 size={18} aria-hidden="true" className="text-faint" />
      )}
    </span>
  )
}
