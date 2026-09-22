import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { BilingualField, Card, FormActions, Switch } from '@/ui'
import { emptyFaq, makeFaqSchema } from './schema'
import strings from './strings'

/**
 * Create / edit form. `onSubmit(values)` must return a promise: when it rejects with a 422 the server's field
 * errors are put on the matching inputs; any other error already produced a toast (crud hook).
 * On edit forms `isEdit` keeps Save disabled until something changed.
 */
export function FaqForm({ defaultValues = emptyFaq, onSubmit, saving = false, isEdit = false }) {
  const c = useCommon()
  const t = useStrings(strings)
  const schema = useMemo(() => makeFaqSchema(c), [c])
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
          <BilingualField name="question" label={t.question} register={register} errors={errors} required maxLength={255} />
          <BilingualField name="answer" label={t.answer} register={register} errors={errors} required multiline rows={5} maxLength={5000} />
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label={t.activeLabel} description={t.activeHint} />}
          />
        </div>
      </Card>
      <FormActions saving={saving} dirty={isEdit ? isDirty : undefined} cancelTo="/faqs" />
    </form>
  )
}
