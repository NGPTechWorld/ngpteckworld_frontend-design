import { useMemo, useRef } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { Alert, BilingualField, Field, FormActions, Modal, Select, Switch } from '@/ui'
import { contentItems } from './hooks'
import { MAX_TEXT_LENGTH, VALUE_ICON_KEYS, hasBody, makeItemSchema, toItemFormValues, toItemPayload } from './schema'
import strings from './strings'
import { ValueIcon } from './ValueIcon'

/**
 * The form inside the modal. It is mounted when the modal opens, so every open starts from clean defaults
 * (an empty form, or the record being edited). `onClose` runs after a successful save.
 */
function ContentItemForm({ collection, item, formRef, onClose }) {
  const c = useCommon()
  const t = useStrings(strings)
  const isEdit = Boolean(item)
  const withBody = hasBody(collection)
  const schema = useMemo(() => makeItemSchema(c, collection), [c, collection])
  const create = contentItems.useCreate()
  const update = contentItems.useUpdate()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: toItemFormValues(collection, item) })
  const icon = useWatch({ control, name: 'icon_key' })
  const saving = create.isPending || update.isPending

  const submit = handleSubmit(async (values) => {
    const data = toItemPayload(collection, values, { isEdit })
    try {
      if (isEdit) await update.mutateAsync({ id: item.id, data })
      else await create.mutateAsync(data)
      onClose()
    } catch (err) {
      applyServerErrors(setError, err) // 422 → the matching fields; anything else was already toasted by the hook
    }
  })

  // errors about fields the form does not show (the API can only complain about them if something is badly wrong)
  const hiddenError = errors.collection?.message || errors.order?.message

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
      {hiddenError ? <Alert tone="danger">{hiddenError}</Alert> : null}

      <BilingualField name="title" label={t.titleLabel} register={register} errors={errors} required maxLength={255} />

      {withBody ? (
        <BilingualField name="body" label={t.bodyLabel} hint={t.bodyHint} register={register} errors={errors} multiline rows={4} maxLength={MAX_TEXT_LENGTH} />
      ) : (
        <Field label={t.iconLabel} hint={t.iconHint} error={errors.icon_key}>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/25 text-accent-lighter">
              <ValueIcon iconKey={icon} size={22} />
            </span>
            <Select {...register('icon_key')} options={VALUE_ICON_KEYS.map((key) => ({ value: key, label: t.iconNames[key] }))} wrapperClassName="flex-1" />
          </div>
        </Field>
      )}

      <Controller
        name="is_active"
        control={control}
        render={({ field }) => (
          <Field error={errors.is_active}>
            <Switch checked={field.value} onChange={field.onChange} label={t.activeLabel} description={t.activeHint} />
          </Field>
        )}
      />

      <FormActions saving={saving} dirty={isEdit ? isDirty : undefined} onCancel={onClose} className="border-t border-white/[.08] pt-4" />
    </form>
  )
}

/**
 * Add / edit one item of a collection: `<ContentItemModal collection="values" item={row | null} onClose={…} />`.
 * It is open for as long as it is mounted. Process steps and why-us have a bilingual title and description;
 * values have a bilingual title and an icon (one of the four the website knows) and no description.
 */
export function ContentItemModal({ collection, item = null, onClose }) {
  const t = useStrings(strings)
  const names = t.collections[collection]
  const formRef = useRef(null)
  // Modal focuses `initialFocusRef.current` — anything with a focus() method will do — so aim at the first field of the form
  const focusFirstField = useRef({ focus: () => formRef.current?.querySelector('input, textarea')?.focus() })

  return (
    <Modal open onClose={onClose} title={item ? names.editTitle : names.createTitle} size="lg" initialFocusRef={focusFirstField}>
      <ContentItemForm key={item?.id ?? 'new'} formRef={formRef} collection={collection} item={item} onClose={onClose} />
    </Modal>
  )
}
