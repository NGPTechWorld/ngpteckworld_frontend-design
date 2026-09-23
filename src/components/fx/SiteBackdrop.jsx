/**
 * Fixed atmosphere behind every page: drifting aurora, a circuit-trace lattice, film grain and a
 * vignette. Purely decorative and never interactive — it sits at z-index 0 with the whole app
 * stacked above it.
 *
 * All of it is CSS and one inline SVG rather than images: it has to survive any viewport without
 * going soft, and four gradients cost far less than a 4K background plate would.
 */
export default function SiteBackdrop() {
  return (
    <div className="ngp-backdrop" aria-hidden="true">
      <div className="ngp-aurora ngp-aurora--1" />
      <div className="ngp-aurora ngp-aurora--2" />
      <div className="ngp-aurora ngp-aurora--3" />

      <svg className="ngp-circuit" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ngpTrace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6B4E8E" stopOpacity="0" />
            <stop offset="45%" stopColor="#9678BE" stopOpacity=".85" />
            <stop offset="100%" stopColor="#6B4E8E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#ngpTrace)" strokeWidth="1.1">
          <path d="M-20 140 H250 L310 200 H520 L580 140 H900" />
          <path d="M-20 660 H180 L250 590 H470 L540 660 H860 L920 600 H1460" />
          <path d="M1460 220 H1180 L1110 290 H880 L820 230 H620" />
          <path d="M120 -20 V120 L180 180 V420 L120 480 V760" />
          <path d="M1320 -20 V180 L1250 250 V520 L1320 590 V920" />
          <path d="M700 920 V760 L760 700 V520" />
        </g>
        <g fill="#C5B2E0">
          <circle cx="310" cy="200" r="3" className="ngp-node" style={{ animationDelay: '0s' }} />
          <circle cx="580" cy="140" r="3" className="ngp-node" style={{ animationDelay: '.7s' }} />
          <circle cx="250" cy="590" r="3" className="ngp-node" style={{ animationDelay: '1.4s' }} />
          <circle cx="920" cy="600" r="3" className="ngp-node" style={{ animationDelay: '2.1s' }} />
          <circle cx="1110" cy="290" r="3" className="ngp-node" style={{ animationDelay: '2.8s' }} />
          <circle cx="180" cy="180" r="3" className="ngp-node" style={{ animationDelay: '3.5s' }} />
          <circle cx="1250" cy="250" r="3" className="ngp-node" style={{ animationDelay: '4.2s' }} />
          <circle cx="760" cy="700" r="3" className="ngp-node" style={{ animationDelay: '4.9s' }} />
        </g>
      </svg>

      <div className="ngp-grain" />
      <div className="ngp-vignette" />
    </div>
  )
}
