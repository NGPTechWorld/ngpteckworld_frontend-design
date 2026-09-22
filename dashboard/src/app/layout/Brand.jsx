import { cx } from '@/lib/cx'

/** NGP logo (white PNG from the public site) — `size` = image height in px. */
export function Brand({ size = 32, className }) {
  return <img src="/assets/ngp-logo-white.png" alt="NGP TechWorld" style={{ height: size }} className={cx('w-auto select-none', className)} draggable="false" />
}
