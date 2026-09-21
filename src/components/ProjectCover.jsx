import { coverFor } from '../lib/visuals'

export default function ProjectCover({ project, height = 190, statusLabel, rounded = false }) {
  const real = project.cover_image
  return (
    <div className="relative flex items-center justify-center overflow-hidden"
      style={{ height, borderRadius: rounded ? 20 : 0,
        background: real ? `center/cover no-repeat url(${real})` : coverFor(project.category) }}>
      {!real && (
        <>
          <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg,transparent 0 12px,rgba(0,0,0,.1) 12px 24px)' }} />
          <img src="/assets/ngp-mark-white.png" alt="" className="relative w-auto opacity-40" style={{ height: height > 250 ? 96 : 54 }} />
        </>
      )}
      {statusLabel && (
        <span className="absolute bottom-3.5 font-mono text-[11px]" style={{ insetInlineEnd: 14, color: '#301D3D', background: 'rgba(255,255,255,.85)', padding: '3px 10px', borderRadius: 20 }}>
          {statusLabel}
        </span>
      )}
    </div>
  )
}
