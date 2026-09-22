import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { newPassword } from '@/lib/validation'
import { Card, Field, FormActions, PasswordInput, useToast } from '@/ui'
import { useChangePassword } from './hooks'
import strings from './strings'

const EMPTY = { current_password: '', password: '', password_confirmation: '' }

/**
 * PUT /auth/password. The three fields are sent as the API names them. The server keeps this session open and signs
 * the other ones out, so after success we only clear the form and say so.
 */
export function PasswordForm() {
  const c = useCommon()
  const t = useStrings(strings)
  const toast = useToast()
  const schema = useMemo(
    () =>
      z
        .object({
          current_password: z.string().min(1, c.required),
          password: newPassword(c),
          password_confirmation: z.string().min(1, c.required),
        })
        .refine((values) => values.password === values.password_confirmation, { path: ['password_confirmation'], error: t.passwordsMismatch }),
    [c, t],
  )
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY })

  const change = useChangePassword({
    onSuccess: () => {
      reset(EMPTY)
      toast.success(t.passwordChanged)
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await change.mutateAsync(values)
    } catch (err) {
      if (applyServerErrors(setError, err) && err.errors?.current_password) {
        setError('current_password', { type: 'server', message: t.currentPasswordWrong }) // the API's text is English
      }
    }
  })

  return (
    <form onSubmit={submit} noValidate>
      <Card title={t.passwordTitle} description={t.passwordDescription} footer={<FormActions saving={change.isPending} dirty={isDirty} saveLabel={t.changePassword} />}>
        <div className="space-y-5">
          <Field label={t.currentPassword} error={errors.current_password} required>
            <PasswordInput autoComplete="current-password" showLabel={t.showPassword} hideLabel={t.hidePassword} {...register('current_password')} />
          </Field>
          <Field label={t.newPassword} error={errors.password} required hint={t.passwordHintCreate}>
            <PasswordInput autoComplete="new-password" showLabel={t.showPassword} hideLabel={t.hidePassword} {...register('password')} />
          </Field>
          <Field label={t.confirmPassword} error={errors.password_confirmation} required>
            <PasswordInput autoComplete="new-password" showLabel={t.showPassword} hideLabel={t.hidePassword} {...register('password_confirmation')} />
          </Field>
        </div>
      </Card>
    </form>
  )
}
