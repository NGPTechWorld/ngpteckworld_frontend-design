import { coverFor } from '../lib/visuals'
import SmartImage from './fx/SmartImage'

/** The cover strip on a project card or detail page: the uploaded image if there is one, otherwise
 *  a tinted panel carrying the mark. */
export default function ProjectCover({ project, height = 190, statusLabel, rounded = false }) {
  const real = project.cover_image

  // The placeholder, also used as SmartImage's fallback so a broken upload degrades to the same
  // panel rather than to a gap.
  const placeholder = (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: coverFor(project.category) }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'repeating-linear-gradient(45deg,transparent 0 12px,rgba(0,0,0,.1) 12px 24px)' }}
      />
      <img
        src="/assets/ngp-mark-white.png"
        alt=""
        width="436"
        height="476"
        className="relative w-auto opacity-40"
        style={{ height: height > 250 ? 96 : 54 }}
      />
    </div>
  )

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{ height, borderRadius: rounded ? 20 : 0 }}
    >
      {/* Was a CSS background-image, which gives nothing to hang a load event on — the cover simply
          appeared whenever it appeared. As an <img> it can shimmer while it loads and fade in. */}
      {real
        ? <SmartImage src={real} className="absolute inset-0" fallback={placeholder} />
        : placeholder}

      {statusLabel && (
        <span
          className="absolute bottom-3.5 z-[1] font-mono text-[11px]"
          style={{ insetInlineEnd: 14, color: '#301D3D', background: 'rgba(255,255,255,.85)', padding: '3px 10px', borderRadius: 20 }}
        >
          {statusLabel}
        </span>
      )}
    </div>
  )
}
