import { Link } from 'react-router-dom'

export default function Button({ to, href, onClick, variant = 'primary', type, children, className = '' }) {
  const base = variant === 'primary'
    ? 'btn-p bg-accent text-white'
    : 'btn border border-white/[.18] bg-white/[.03] text-ink'
  const cls = `${base} inline-block rounded-xl px-7 py-[15px] text-[15px] font-semibold ${className}`
  if (to) return <Link to={to} className={cls}>{children}</Link>
  if (href) return <a href={href} className={cls}>{children}</a>
  return <button type={type || 'button'} onClick={onClick} className={cls}>{children}</button>
}
