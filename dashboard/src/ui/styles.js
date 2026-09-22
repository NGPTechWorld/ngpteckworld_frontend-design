import { cx } from '@/lib/cx'

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-deep'

/** Shared look of Input / Textarea / Select / TagsInput. */
export function controlClass(invalid, extra) {
  return cx(
    'w-full rounded-xl border bg-white/[.04] px-3.5 py-2.5 text-sm text-ink placeholder:text-faint',
    'transition-colors focus:outline-none focus:ring-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    invalid
      ? 'border-danger/70 focus:border-danger focus:ring-danger/30'
      : 'border-white/[.12] hover:border-white/25 focus:border-accent-light focus:ring-accent-light/30',
    extra,
  )
}

/** Add to directional icons (arrows, chevrons) so they mirror in RTL. */
export const flipRtl = 'rtl:-scale-x-100'
