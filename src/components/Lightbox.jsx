import { useEffect } from 'react'

export default function Lightbox({ src, bg, label, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div onClick={onClose} role="dialog" aria-modal="true" aria-label={label}
      className="fixed inset-0 z-[100] flex items-center justify-center p-10"
      style={{ background: 'rgba(10,6,16,.9)', backdropFilter: 'blur(6px)', cursor: 'zoom-out' }}>
      {src ? (
        <img src={src} alt={label} className="rounded-2xl border border-white/[.12] object-contain"
          style={{ maxWidth: 'min(1100px,90vw)', maxHeight: '85vh' }} />
      ) : (
        <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/[.12]"
          style={{ width: 'min(900px,90vw)', aspectRatio: '4/3', background: bg }}>
          <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg,transparent 0 16px,rgba(0,0,0,.1) 16px 32px)' }} />
          <span className="relative font-mono text-white/80">{label}</span>
        </div>
      )}
      <div className="absolute top-6 flex h-11 w-11 items-center justify-center rounded-full text-[22px] text-white"
        style={{ insetInlineStart: 24, background: 'rgba(255,255,255,.1)' }}>✕</div>
    </div>
  )
}
