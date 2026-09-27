import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { Card, Field, FormActions, Textarea } from '@/ui'
import { makeNotesSchema, toNotesPayload, toNotesValues } from '@/features/requests/schema'
import { offerRequests } from './hooks'
import strings from './strings'

/** The private notes of an offer request. Mount it with `key={request.id}`; it resets to what was saved. */
export function NotesForm({ request }) {
  const c = useCommon()
  const t = useStrings(strings)
  const schema = useMemo(() => makeNotesSchema(c), [c])
  const update = offerRequests.useUpdate()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: toNotesValues(request) })

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync({ id: request.id, data: toNotesPayload(values) })
      reset(toNotesValues(saved ?? { admin_notes: values.admin_notes }))
    } catch (err) {
      applyServerErrors(setError, err) // other failures already produced a toast
    }
  })

  return (
    <form onSubmit={submit} noValidate>
      <Card title={t.notesTitle} description={t.notesHint} footer={<FormActions saving={update.isPending} dirty={isDirty} saveLabel={t.saveNotes} />}>
        <Field label={t.notesTitle} labelClassName="sr-only" error={errors.admin_notes}>
          <Textarea rows={5} maxLength={5000} dir="auto" placeholder={t.notesPlaceholder} {...register('admin_notes')} />
        </Field>
      </Card>
    </form>
  )
}
