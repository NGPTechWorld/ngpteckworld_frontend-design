import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { BilingualField, Card, Field, FormActions, ImageUpload, Input, Switch } from '@/ui'
import { PdfUpload } from './PdfUpload'
import { emptyBook, makeBookSchema } from './schema'
import strings from './strings'

/**
 * Create / edit form. `onSubmit(values)` must return a promise: a 422 puts the server's messages on the matching
 * fields; any other error already produced a toast (crud hook). `book` (edit only) feeds the previews.
 */
export function BookForm({ defaultValues = emptyBook, book, onSubmit, saving = false, isEdit = false }) {
  const c = useCommon()
  const t = useStrings(strings)
  const schema = useMemo(() => makeBookSchema(c), [c])
  const [coverBusy, setCoverBusy] = useState(false)
  const [fileBusy, setFileBusy] = useState(false)
  const uploading = coverBusy || fileBusy
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
      <Card title={t.sectionBook} description={t.sectionBookHint}>
        <div className="space-y-6">
          <BilingualField name="title" label={t.bookTitle} register={register} errors={errors} required maxLength={255} placeholder={{ ar: 'أساسيات البرمجة', en: 'Programming Basics' }} />
          <BilingualField name="author" label={t.author} register={register} errors={errors} maxLength={255} />
          <div className="flex flex-col gap-6 sm:flex-row">
            <Controller
              name="cover_image"
              control={control}
              render={({ field }) => (
                <Field label={t.cover} hint={t.coverHint} error={errors.cover_image} className="shrink-0">
                  <ImageUpload folder="books" shape="square" value={field.value} url={book?.cover_image_url} alt={t.cover} onChange={field.onChange} onUploadingChange={setCoverBusy} />
                </Field>
              )}
            />
            <Controller
              name="file_path"
              control={control}
              render={({ field }) => (
                <Field label={t.file} hint={t.fileHint} error={errors.file_path} required className="min-w-0 flex-1">
                  <PdfUpload value={field.value} url={book?.file_url} size={book?.file_size} onChange={field.onChange} onUploadingChange={setFileBusy} />
                </Field>
              )}
            />
          </div>
        </div>
      </Card>

      <Card title={t.sectionDetails}>
        <div className="space-y-6">
          <BilingualField name="description" label={t.bookDescription} register={register} errors={errors} required multiline rows={6} maxLength={10000} />
          <BilingualField name="category" label={t.category} register={register} errors={errors} maxLength={255} placeholder={{ ar: 'برمجة', en: 'Programming' }} />
          <BilingualField name="language" label={t.language} register={register} errors={errors} maxLength={100} placeholder={{ ar: 'العربية', en: 'Arabic' }} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.pages} error={errors.pages}>
              <Input {...register('pages')} type="number" min={1} inputMode="numeric" dir="ltr" placeholder="320" />
            </Field>
            <Field label={t.year} error={errors.year}>
              <Input {...register('year')} type="number" min={1000} max={2100} inputMode="numeric" dir="ltr" placeholder="2024" />
            </Field>
          </div>
        </div>
      </Card>

      <Card title={t.sectionStatus}>
        <div className="space-y-6">
          <Field label={t.slug} error={errors.slug} hint={t.slugHint}>
            <Input {...register('slug')} dir="ltr" maxLength={255} placeholder="programming-basics" autoComplete="off" />
          </Field>
          <Controller
            name="allow_download"
            control={control}
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label={t.allowDownload} description={t.allowDownloadHint} />}
          />
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label={t.activeLabel} description={t.activeHint} />}
          />
        </div>
      </Card>

      <FormActions saving={saving} disabled={uploading} dirty={isEdit ? isDirty : undefined} cancelTo="/library" />
    </form>
  )
}
