import { Link } from 'react-router-dom'
import { cx } from '@/lib/cx'
import { focusRing } from './styles'

const tones = {
  default: 'text-muted hover:bg-white/[.09] hover:text-ink',
  danger: 'text-danger/90 hover:bg-danger/15 hover:text-danger',
  accent: 'text-accent-lighter hover:bg-accent/25 hover:text-white',
}
const sizes = { sm: 'size-8', md: 'size-9', lg: 'size-11' }
const iconSizes = { sm: 15, md: 17, lg: 20 }

/**
 * Icon-only button. `label` is REQUIRED: it becomes aria-label and the tooltip.
 * <IconButton icon={Trash2} label="Delete" tone="danger" onClick={…} /> · with `to` it renders a <Link>.
 */
export function IconButton({ icon: Icon, label, tone = 'default', size = 'md', to, type = 'button', className, ...rest }) {
  const cls = cx(
    'inline-flex shrink-0 items-center justify-center rounded-lg transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-40',
    focusRing,
    tones[tone],
    sizes[size],
    className,
  )
  const icon = <Icon size={iconSizes[size]} aria-hidden="true" />

  if (to) {
    return (
      <Link to={to} aria-label={label} title={label} className={cls} {...rest}>
        {icon}
      </Link>
    )
  }
  return (
    <button type={type} aria-label={label} title={label} className={cls} {...rest}>
      {icon}
    </button>
  )
}
