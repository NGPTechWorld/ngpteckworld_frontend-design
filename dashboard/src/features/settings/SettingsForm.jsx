import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link2, Mail, MessageCircle, Phone } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { Alert, Card, Field, FormActions, Input } from '@/ui'
import { EXAMPLES, SOCIALS, makeSettingsSchema, toFormValues, toPayload } from './schema'
import strings from './strings'

/**
 * One form for the whole settings row. `onSubmit(payload)` receives only the changed fields (see toPayload) and must
 * resolve with the saved settings: the form is then reset to them, so Save is disabled again until the next edit.
 * A 422 puts the server's messages on the matching fields (`applyServerErrors`); other failures were toasted already.
 */
export function SettingsForm({ defaultValues, onSubmit, saving = false }) {
  const c = useCommon()
  const t = useStrings(strings)
  const schema = useMemo(() => makeSettingsSchema(c), [c])
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, dirtyFields },
  } = useForm({ resolver: zodResolver(schema), defaultValues })

  const submit = handleSubmit(async (values) => {
    const payload = toPayload(values, dirtyFields)
    if (Object.keys(payload).length === 0) return
    try {
      const saved = await onSubmit(payload)
      reset(toFormValues(saved))
    } catch (err) {
      applyServerErrors(setError, err)
    }
  })

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-5">
      <Card title={t.contactTitle} description={t.contactDescription}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.email} hint={t.emailHint} error={errors.email}>
            <Input type="email" autoComplete="off" startIcon={Mail} placeholder="info@ngptechworld.com" {...register('email')} />
          </Field>
          <Field label={t.phone} hint={t.phoneHint} error={errors.phone}>
            <Input type="tel" autoComplete="off" startIcon={Phone} placeholder="+963 933 000 000" {...register('phone')} />
          </Field>
        </div>
      </Card>

      <Card title={t.socialTitle} description={t.socialDescription}>
        <Alert tone="info" className="mb-5">
          {t.socialInfo} <bdi dir="ltr">https://</bdi>
        </Alert>
        <div className="grid gap-5">
          {SOCIALS.map((key) => (
            <Field
              key={key}
              label={t.networks[key].label}
              error={errors[key]}
              hint={
                <>
                  {t.networks[key].hint} <bdi dir="ltr">{EXAMPLES[key]}</bdi>
                </>
              }
            >
              <Input type="url" autoComplete="off" startIcon={key === 'whatsapp' ? MessageCircle : Link2} placeholder={EXAMPLES[key]} {...register(key)} />
            </Field>
          ))}
        </div>
      </Card>

      <FormActions saving={saving} dirty={isDirty} onCancel={isDirty ? () => reset() : undefined} cancelLabel={t.discard} />
    </form>
  )
}
