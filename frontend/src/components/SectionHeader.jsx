export default function SectionHeader({ kicker, title, sub, center = true, as = 'h2' }) {
  const H = as
  const size = as === 'h1' ? 'text-[44px] font-extrabold' : 'text-[38px] font-bold'
  return (
    <div className={`mb-11 ${center ? 'text-center' : ''}`}>
      {kicker && <div className="mb-2.5 font-mono text-[13px] text-accent-light">// {kicker}</div>}
      <H className={`mb-3.5 ${size}`}>{title}</H>
      {sub && <p className="mx-auto max-w-[560px] text-[17px] text-muted">{sub}</p>}
    </div>
  )
}
