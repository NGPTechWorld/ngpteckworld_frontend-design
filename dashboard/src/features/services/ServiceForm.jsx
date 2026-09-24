import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { BilingualField, BilingualTags, Card, FormActions, Switch } from '@/ui'
import { IconPicker } from './IconPicker'
import { emptyService, makeServiceSchema } from './schema'
import strings from './strings'

/**
 * Create / edit form. `onSubmit(values)` must return a promise: when it rejects with a 422 the server's field
 * errors are put on the matching inputs; any other error already produced a toast (crud hook).
 * On edit forms `isEdit` keeps Save disabled until something changed.
 */
export function ServiceForm({ defaultValues = emptyService, onSubmit, saving = false, isEdit = false }) {
  const c = useCommon()
  const t = useStrings(strings)
  const schema = useMemo(() => makeServiceSchema(c), [c])
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues })

  const submit = handleSubmit(async (values) => {
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
          <Controller
            name="icon_key"
            control={control}
            render={({ field }) => (
              <IconPicker ref={field.ref} value={field.value} onChange={field.onChange} labels={t.icons} label={t.icon} hint={t.iconHint} required error={errors.icon_key} />
            )}
          />
          <BilingualField name="title" label={t.serviceTitle} register={register} errors={errors} required maxLength={255} />
          <BilingualField name="description" label={t.serviceDescription} register={register} errors={errors} required multiline rows={5} maxLength={5000} />
          <BilingualTags name="features" label={t.features} hint={t.featuresHint} control={control} errors={errors} />
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label={t.activeLabel} description={t.activeHint} />}
          />
        </div>
      </Card>
      <FormActions saving={saving} dirty={isEdit ? isDirty : undefined} cancelTo="/services" />
    </form>
  )
}
