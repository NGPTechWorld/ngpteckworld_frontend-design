import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/app/AuthProvider'
import { useCommon } from '@/i18n'
import { api } from '@/lib/api'
import { errorText } from '@/lib/errors'
import { useToast } from '@/ui'

/** PUT /auth/profile { name, email } → the user; the top bar shows the new name at once (auth.updateUser). */
export function useUpdateProfile({ onSuccess } = {}) {
  const { updateUser } = useAuth()
  const toast = useToast()
  const c = useCommon()
  return useMutation({
    mutationFn: (values) => api.put('/auth/profile', values).then((res) => res.data),
    onSuccess: (user, ...args) => {
      updateUser(user)
      return onSuccess?.(user, ...args)
    },
    onError: (err) => toast.error(errorText(err, c)),
  })
}

/**
 * PUT /auth/password { current_password, password, password_confirmation } → 204. The server signs the account out
 * everywhere else but keeps this token valid, so nothing happens to the session here.
 */
export function useChangePassword({ onSuccess } = {}) {
  const toast = useToast()
  const c = useCommon()
  return useMutation({
    mutationFn: (values) => api.put('/auth/password', values),
    onSuccess: (...args) => onSuccess?.(...args),
    onError: (err) => toast.error(errorText(err, c)),
  })
}
