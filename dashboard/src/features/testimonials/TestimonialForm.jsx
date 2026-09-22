import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { BilingualField, Card, Field, FormActions, ImageUpload, Input, Switch } from '@/ui'
import { StarRatingInput } from './StarRating'
import { emptyTestimonial, makeTestimonialSchema } from './schema'
import strings from './strings'

/**
 * Create / edit form. `onSubmit(values)` must return a promise: when it rejects with a 422 the server's field
 * errors are put on the matching inputs; any other error already produced a toast (crud hook).
 * On edit forms `isEdit` keeps Save disabled until something changed. `avatarUrl` is the absolute URL of the
 * saved avatar (`record.avatar_url`), used only for the preview; the form value is the relative path.
 */
export function TestimonialForm({ defaultValues = emptyTestimonial, avatarUrl, onSubmit, saving = false, isEdit = false }) {
  const c = useCommon()
  const t = useStrings(strings)
  const schema = useMemo(() => makeTestimonialSchema(c), [c])
  const [uploading, setUploading] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues })

  const submit = handleSubmit(async (values) => {
    if (uploading) return
    try {
      await onSubmit(values)
    } catch (err) {
      applyServerErrors(setError, err)
    }
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Card>
        <div className="space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            <Controller
              name="avatar"
              control={control}
              render={({ field }) => (
                <Field label={t.avatar} hint={t.avatarHint} error={errors.avatar} className="shrink-0">
                  <ImageUpload shape="circle" folder="testimonials" value={field.value} url={avatarUrl} alt={t.avatar} onChange={field.onChange} onUploadingChange={setUploading} />
                </Field>
              )}
            />
            <div className="min-w-0 flex-1 space-y-6">
              <Field label={t.name} error={errors.name} required>
                <Input {...register('name')} maxLength={255} autoComplete="off" />
              </Field>
              <Field label={t.company} error={errors.company} hint={t.companyHint}>
                <Input {...register('company')} maxLength={255} autoComplete="off" />
              </Field>
            </div>
          </div>
          <BilingualField name="quote" label={t.quote} register={register} errors={errors} required multiline rows={4} maxLength={2000} />
          <Controller
            name="rating"
            control={control}
            render={({ field }) => <StarRatingInput ref={field.ref} value={field.value} onChange={field.onChange} label={t.rating} required error={errors.rating} />}
          />
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label={t.activeLabel} description={t.activeHint} />}
          />
        </div>
      </Card>
      <FormActions saving={saving} disabled={uploading} dirty={isEdit ? isDirty : undefined} cancelTo="/testimonials" />
    </form>
  )
}
