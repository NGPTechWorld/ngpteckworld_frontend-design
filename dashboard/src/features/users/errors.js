import { errorText } from '@/lib/errors'

/**
 * Text for a failed user deletion or role change. The API answers 422 in two shapes: a plain
 * `{ message }` when you try to delete yourself, or field errors `{ errors: { role: [...] } }` when
 * the change would leave the site with zero super admins — both are replaced by the localized
 * strings (any other 422 message is shown as the server wrote it). `t` = feature strings, `c` = common strings.
 */
export function deleteErrorText(err, t, c) {
  if (err?.status === 422) {
    if (err.errors?.role) return t.guardLastSuperAdmin
    const message = String(err.message ?? '')
    if (/own account/i.test(message)) return t.guardSelf
    return message || c.validationFailed
  }
  return errorText(err, c)
}
