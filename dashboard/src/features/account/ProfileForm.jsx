import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { requiredEmail, requiredText } from '@/lib/validation'
import { Card, Field, FormActions, Input, useToast } from '@/ui'
import { useUpdateProfile } from './hooks'
import strings from './strings'

/** Name + email of the signed-in admin (PUT /auth/profile). Save is disabled until something changed. */
export function ProfileForm({ user }) {
  const c = useCommon()
  const t = useStrings(strings)
  const toast = useToast()
  const schema = useMemo(() => z.object({ name: requiredText(c, 255), email: requiredEmail(c) }), [c])
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { name: user.name ?? '', email: user.email ?? '' } })

  const save = useUpdateProfile({
    onSuccess: (saved) => {
      reset({ name: saved.name, email: saved.email })
      toast.success(t.profileSaved)
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values)
    } catch (err) {
      applyServerErrors(setError, err) // 422 (e.g. the email is taken); other failures were toasted by the hook
    }
  })

  return (
    <form onSubmit={submit} noValidate>
      <Card title={t.profileTitle} description={t.profileDescription} footer={<FormActions saving={save.isPending} dirty={isDirty} />}>
        <div className="space-y-5">
          <Field label={t.name} error={errors.name} required>
            <Input autoComplete="name" {...register('name')} />
          </Field>
          <Field label={t.email} error={errors.email} required>
            <Input type="email" autoComplete="username" {...register('email')} />
          </Field>
        </div>
      </Card>
    </form>
  )
}
