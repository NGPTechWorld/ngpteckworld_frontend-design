import { useState } from 'react'
import { cx } from '@/lib/cx'

const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg', xl: 'size-20 text-2xl' }
const shapes = { circle: 'rounded-full', rounded: 'rounded-xl', square: 'rounded-none' }

/** Image (logo / avatar / cover thumbnail) with an initial-letter fallback: <Avatar src={row.logo_url} name={row.name} size="md" shape="rounded" /> */
export function Avatar({ src, name = '', alt, size = 'md', shape = 'circle', className }) {
  const [failed, setFailed] = useState(false)
  const initial = name.trim().charAt(0).toUpperCase()
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center overflow-hidden bg-accent/30 font-bold text-accent-lighter', sizes[size], shapes[shape], className)}>
      {src && !failed ? (
        <img src={src} alt={alt ?? name} loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initial || '?'}</span>
      )}
    </span>
  )
}
