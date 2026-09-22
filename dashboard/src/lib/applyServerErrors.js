import { ApiError } from './api'

/**
 * Put Laravel's 422 `errors` onto a react-hook-form instance:
 *
 *   try { await save.mutateAsync(values) } catch (err) { applyServerErrors(setError, err) }
 *
 * Field names map 1:1 (`features_ar.0` is also a valid RHF path). The first message of every field is used and
 * the first invalid field is focused. The response `message` is stored under `errors.root.server` for a
 * form-level <Alert>. Returns true when `err` was a validation error, so callers can handle other failures.
 */
export function applyServerErrors(setError, err) {
  if (!(err instanceof ApiError) || err.status !== 422) return false

  Object.entries(err.errors).forEach(([field, messages], index) => {
    const message = Array.isArray(messages) ? messages[0] : String(messages)
    setError(field, { type: 'server', message }, { shouldFocus: index === 0 })
  })
  setError('root.server', { type: 'server', message: err.message })
  return true
}
