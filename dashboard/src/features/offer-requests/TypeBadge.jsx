import { useStrings } from '@/i18n'
import { Badge } from '@/ui'
import strings from './strings'

/** Booking (green) or inquiry (blue) — the same colours as the Telegram message, so both read alike. */
export function TypeBadge({ type }) {
  const t = useStrings(strings)
  return (
    <Badge tone={type === 'booking' ? 'success' : 'info'} dot>
      {t.types[type] ?? type}
    </Badge>
  )
}
