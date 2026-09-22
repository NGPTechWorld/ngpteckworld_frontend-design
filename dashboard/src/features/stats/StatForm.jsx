import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { BilingualField, Card, Field, FormActions, Input } from '@/ui'
import { emptyStat, makeStatSchema } from './schema'
import strings from './strings'

/**
 * Create / edit form. `onSubmit(values)` must return a promise: when it rejects with a 422 the server's field
 * errors are put on the matching inputs; any other error already produced a toast (crud hook).
 * On edit forms `isEdit` keeps Save disabled until something changed.
 */
export function StatForm({ defaultValues = emptyStat, onSubmit, saving = false, isEdit = false }) {
  const c = useCommon()
  const t = useStrings(strings)
  const schema = useMemo(() => makeStatSchema(c), [c])
  const {
    register,
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
          <Field label={t.value} error={errors.value} hint={t.valueHint} required className="max-w-xs">
            <Input {...register('value')} dir="ltr" maxLength={20} placeholder="240+" autoComplete="off" />
          </Field>
          <BilingualField name="label" label={t.label} hint={t.labelHint} register={register} errors={errors} required maxLength={255} />
        </div>
      </Card>
      <FormActions saving={saving} dirty={isEdit ? isDirty : undefined} cancelTo="/stats" />
    </form>
  )
}
