import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { Card, Field, FormActions, ImageUpload, Input, Switch } from '@/ui'
import { emptyPartner, makePartnerSchema } from './schema'
import strings from './strings'

/**
 * Create / edit form. `onSubmit(values)` must return a promise: when it rejects with a 422 the server's field
 * errors are put on the matching inputs; any other error already produced a toast (crud hook).
 * On edit forms `isEdit` keeps Save disabled until something changed. `logoUrl` is the absolute URL of the saved
 * logo (`record.logo_url`), used only for the preview; the form value is the relative path.
 */
export function PartnerForm({ defaultValues = emptyPartner, logoUrl, onSubmit, saving = false, isEdit = false }) {
  const c = useCommon()
  const t = useStrings(strings)
  const schema = useMemo(() => makePartnerSchema(c), [c])
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
          <Field label={t.name} error={errors.name} required>
            <Input {...register('name')} maxLength={255} autoComplete="off" />
          </Field>
          <Field label={t.website} error={errors.url} hint={t.websiteHint}>
            <Input {...register('url')} type="url" inputMode="url" maxLength={255} placeholder="https://example.com" autoComplete="off" />
          </Field>
          <Controller
            name="logo"
            control={control}
            render={({ field }) => (
              <Field label={t.logo} hint={t.logoHint} error={errors.logo}>
                <ImageUpload folder="partners" value={field.value} url={logoUrl} alt={t.logo} onChange={field.onChange} onUploadingChange={setUploading} />
              </Field>
            )}
          />
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label={t.activeLabel} description={t.activeHint} />}
          />
        </div>
      </Card>
      <FormActions saving={saving} disabled={uploading} dirty={isEdit ? isDirty : undefined} cancelTo="/partners" />
    </form>
  )
}
