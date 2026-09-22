import { Link } from 'react-router-dom'
import { cx } from '@/lib/cx'
import { Spinner } from './Spinner'
import { focusRing } from './styles'

export const buttonVariants = {
  primary: 'bg-accent text-white hover:bg-accent-hover hover:shadow-btnhover',
  secondary: 'border border-white/[.16] bg-white/[.04] text-ink hover:bg-white/[.09]',
  ghost: 'text-muted hover:bg-white/[.07] hover:text-ink',
  danger: 'bg-danger text-deep hover:brightness-110',
  gold: 'bg-gold text-deep hover:bg-gold-light',
}

export const buttonSizes = {
  sm: 'h-9 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-[15px]',
}

const iconSize = { sm: 15, md: 16, lg: 18 }

/**
 * <Button variant="primary|secondary|ghost|danger|gold" size="sm|md|lg" icon={Plus} loading to="/x">
 * `icon` renders before the label, `iconEnd` after it (directional icons: add `flipRtl` class via iconClassName).
 * With `to` it renders a router <Link>, with `href` an <a>. Default type is "button".
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconEnd: IconEnd,
  iconClassName,
  loading = false,
  disabled = false,
  to,
  href,
  type = 'button',
  className,
  children,
  ...rest
}) {
  const cls = cx(
    'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-xl font-semibold transition-all',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    focusRing,
    buttonVariants[variant],
    buttonSizes[size],
    className,
  )
  const inner = (
    <>
      {loading ? <Spinner size={iconSize[size]} /> : Icon ? <Icon size={iconSize[size]} aria-hidden="true" className={iconClassName} /> : null}
      {children}
      {IconEnd && !loading ? <IconEnd size={iconSize[size]} aria-hidden="true" className={iconClassName} /> : null}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={cls} aria-disabled={disabled || undefined} {...rest}>
        {inner}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={cls} aria-disabled={disabled || undefined} {...rest}>
        {inner}
      </a>
    )
  }
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {inner}
    </button>
  )
}
