import { useId, useMemo, useState } from 'react'
import { Controller, get, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Minus, Plus, Trash2 } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { BilingualField, Button, Card, Field, FormActions, GalleryUpload, IconButton, ImageUpload, Input, Switch, fieldErrorMessage } from '@/ui'
import { GALLERY_MAX, emptyFeature, emptyOffer, emptyPlan, makeOfferSchema } from './schema'
import strings from './strings'

/** Label + hint + error around a control that is not a single form element (the gallery). */
function LabeledGroup({ label, hint, error, children }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={`${id}-label`} className="min-w-0">
      <p id={`${id}-label`} className="mb-1.5 text-[13px] font-semibold text-soft">
        {label}
      </p>
      {children}
      {error ? <p role="alert" className="mt-1.5 text-xs font-medium text-danger">{error}</p> : null}
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

/** Length of a plan in days: a number with − / + and one-click presets (a month, three months, a year). */
function DurationField({ name, control, errors }) {
  const t = useStrings(strings)
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = field.value === '' || field.value == null ? '' : Number(field.value)
        const step = (delta) => field.onChange(String(Math.min(3650, Math.max(1, (Number(value) || 0) + delta))))
        return (
          <Field label={t.planDuration} hint={t.planDurationHint} error={fieldErrorMessage(get(errors, name))}>
            <div className="flex flex-wrap items-center gap-2">
              <IconButton icon={Minus} label={t.durationLess} onClick={() => step(-1)} disabled={!value || value <= 1} />
              <Input
                ref={field.ref}
                type="number"
                inputMode="numeric"
                min={1}
                max={3650}
                dir="ltr"
                className="!w-28 text-center"
                value={value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
              <IconButton icon={Plus} label={t.durationMore} onClick={() => step(1)} disabled={value >= 3650} />
              <span className="text-sm text-muted">{t.days}</span>
              <div className="ms-2 flex flex-wrap gap-1.5">
                {[30, 90, 180, 365].map((days) => (
                  <Button key={days} type="button" size="sm" variant={value === days ? 'primary' : 'secondary'} onClick={() => field.onChange(String(days))}>
                    {t.durationPreset[days]}
                  </Button>
                ))}
              </div>
            </div>
          </Field>
        )
      }}
    />
  )
}

/**
 * An ordered list of entries edited in place (the features, the plans): one bordered box per entry with
 * move up / move down / remove, and an "add" button. `renderEntry(index)` draws the fields of one entry.
 */
function EntryList({ name, control, title, description, empty, addLabel, newEntry, labelOf, max, renderEntry }) {
  const t = useStrings(strings)
  const { fields, append, remove, move } = useFieldArray({ control, name })
  const entries = useWatch({ control, name }) ?? []

  return (
    <Card title={title} description={description}>
      <div className="space-y-4">
        {fields.length === 0 ? <p className="text-sm text-muted">{empty}</p> : null}
        {fields.map((item, index) => {
          const label = labelOf(entries[index] ?? {}) || t.entryN(index + 1)
          return (
            <fieldset key={item.id} aria-label={label} className="space-y-4 rounded-xl border border-white/[.08] bg-white/[.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold" dir="auto">
                  {label}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton icon={ArrowUp} size="sm" label={t.moveUp(label)} onClick={() => move(index, index - 1)} disabled={index === 0} />
                  <IconButton icon={ArrowDown} size="sm" label={t.moveDown(label)} onClick={() => move(index, index + 1)} disabled={index === fields.length - 1} />
                  <IconButton icon={Trash2} size="sm" tone="danger" label={t.remove(label)} onClick={() => remove(index)} />
                </div>
              </div>
              {renderEntry(index)}
            </fieldset>
          )
        })}
        <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={() => append(newEntry())} disabled={fields.length >= max}>
          {addLabel}
        </Button>
      </div>
    </Card>
  )
}

/**
 * Create / edit form. `onSubmit(values)` must return a promise: a 422 puts the server's messages on the matching
 * fields; any other error already produced a toast (crud hook). `offer` (edit only) feeds the image previews.
 */
export function OfferForm({ defaultValues = emptyOffer, offer, onSubmit, saving = false, isEdit = false }) {
  const c = useCommon()
  const t = useStrings(strings)
  const schema = useMemo(() => makeOfferSchema(c), [c])
  const [coverBusy, setCoverBusy] = useState(false)
  const [galleryBusy, setGalleryBusy] = useState(false)
  const uploading = coverBusy || galleryBusy
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

  const pickLabel = (field) => (entry) => entry[`${field}_en`] || entry[`${field}_ar`]

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Card title={t.sectionCard} description={t.sectionCardHint}>
        <div className="space-y-6">
          <BilingualField name="title" label={t.offerTitle} register={register} errors={errors} required maxLength={255} placeholder={{ ar: 'تطبيق محاسبة', en: 'Accounting app' }} />
          <BilingualField name="short" label={t.short} hint={t.shortHint} register={register} errors={errors} required multiline rows={2} maxLength={500} />
          <Controller
            name="cover_image"
            control={control}
            render={({ field }) => (
              <Field label={t.cover} hint={t.coverHint} error={errors.cover_image}>
                <ImageUpload folder="offers" value={field.value} url={offer?.cover_image_url} alt={t.cover} onChange={field.onChange} onUploadingChange={setCoverBusy} />
              </Field>
            )}
          />
        </div>
      </Card>

      <Card title={t.sectionDetails} description={t.sectionDetailsHint}>
        <div className="space-y-6">
          <BilingualField name="description" label={t.fullDescription} register={register} errors={errors} required multiline rows={6} maxLength={10000} />
          <Controller
            name="gallery"
            control={control}
            render={({ field }) => (
              <LabeledGroup label={t.gallery} hint={t.galleryHint} error={errors.gallery?.message}>
                <GalleryUpload folder="offers" max={GALLERY_MAX} value={field.value} onChange={field.onChange} onUploadingChange={setGalleryBusy} invalid={Boolean(errors.gallery)} />
              </LabeledGroup>
            )}
          />
          <Field label={t.video} hint={t.videoHint} error={errors.video_url}>
            <Input type="url" dir="ltr" {...register('video_url')} placeholder="https://youtube.com/watch?v=…" autoComplete="off" />
          </Field>
        </div>
      </Card>

      <EntryList
        name="features"
        control={control}
        title={t.features}
        description={t.featuresHint}
        empty={t.featuresEmpty}
        addLabel={t.featureAdd}
        newEntry={emptyFeature}
        labelOf={pickLabel('title')}
        max={50}
        renderEntry={(index) => (
          <>
            <BilingualField name={`features.${index}.title`} label={t.featureTitle} register={register} errors={errors} required maxLength={255} />
            <BilingualField name={`features.${index}.description`} label={t.featureDescription} register={register} errors={errors} multiline rows={2} maxLength={2000} />
          </>
        )}
      />

      <EntryList
        name="plans"
        control={control}
        title={t.plans}
        description={t.plansHint}
        empty={t.plansEmpty}
        addLabel={t.planAdd}
        newEntry={emptyPlan}
        labelOf={pickLabel('name')}
        max={10}
        renderEntry={(index) => (
          <>
            <BilingualField name={`plans.${index}.name`} label={t.planName} register={register} errors={errors} required maxLength={255} placeholder={{ ar: 'شهري', en: 'Monthly' }} />
            <BilingualField name={`plans.${index}.price`} label={t.planPrice} hint={t.planPriceHint} register={register} errors={errors} maxLength={100} placeholder={{ ar: '20$', en: '$20' }} />
            <DurationField name={`plans.${index}.duration_days`} control={control} errors={errors} />
            <BilingualField name={`plans.${index}.description`} label={t.planDescription} register={register} errors={errors} multiline rows={3} maxLength={2000} />
            <Controller
              name={`plans.${index}.highlighted`}
              control={control}
              render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label={t.planHighlighted} description={t.planHighlightedHint} />}
            />
          </>
        )}
      />

      <Card title={t.plansNote} description={t.plansNoteHint}>
        <BilingualField name="plans_note" label={t.plansNote} register={register} errors={errors} multiline rows={3} maxLength={5000} />
      </Card>

      <Card title={t.sectionStatus}>
        <div className="space-y-6">
          <Field label={t.slug} error={errors.slug} hint={t.slugHint}>
            <Input {...register('slug')} dir="ltr" maxLength={255} placeholder="accounting-app" autoComplete="off" />
          </Field>
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label={t.activeLabel} description={t.activeHint} />}
          />
        </div>
      </Card>

      <FormActions saving={saving} disabled={uploading} dirty={isEdit ? isDirty : undefined} cancelTo="/offers" />
    </form>
  )
}
