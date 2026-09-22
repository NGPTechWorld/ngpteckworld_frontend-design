import { z } from 'zod'
import { newPassword, requiredEmail, requiredText } from '@/lib/validation'

/** Every section a limited admin can be given — must mirror the backend's `User::SECTIONS` exactly. */
export const SECTIONS = ['faqs', 'page-content', 'partners', 'projects', 'requests', 'services', 'settings', 'stats', 'testimonials']

export const ROLES = ['super_admin', 'admin']

export const emptyUser = { name: '', email: '', password: '', role: 'admin', permissions: [] }

/** Mirrors UserController::rules. On edit the password is optional ('' = keep the current one); a limited admin
 * (role=admin) must be given at least one section — the API itself only requires the field to be an array. */
export function makeUserSchema(c, t, { isEdit = false } = {}) {
  return z
    .object({
      name: requiredText(c, 255),
      email: requiredEmail(c),
      password: isEdit ? z.string().max(255, c.maxLength(255)).refine((value) => value === '' || value.length >= 8, { error: c.minLength(8) }) : newPassword(c),
      role: z.enum(ROLES),
      permissions: z.array(z.enum(SECTIONS)),
    })
    .refine((values) => values.role !== 'admin' || values.permissions.length > 0, {
      path: ['permissions'],
      error: t.permissionsRequired,
    })
}

/** API record → form values (the password is never sent by the API). */
export const toFormValues = (user) => ({
  name: user.name,
  email: user.email,
  password: '',
  role: user.role,
  permissions: user.permissions ?? [],
})

/** An empty password is left out on edit so the API keeps the current one; a super admin's `permissions` is
 * always sent empty (the API clears it server-side too — kept in sync so the form never shows a stale list). */
export function toPayload(values, { isEdit = false } = {}) {
  const payload = {
    name: values.name,
    email: values.email,
    role: values.role,
    permissions: values.role === 'super_admin' ? [] : values.permissions,
  }
  if (!isEdit || values.password) payload.password = values.password
  return payload
}
