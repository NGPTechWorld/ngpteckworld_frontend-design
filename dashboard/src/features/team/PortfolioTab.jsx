import { useEffect, useId, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Briefcase, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { errorText } from '@/lib/errors'
import { Alert, BilingualField, Button, Card, EmptyState, Field, GalleryUpload, IconButton, ImageUpload, Input, Modal, SortableList, Spinner, useConfirm } from '@/ui'
import { useTeamPortfolio } from './hooks'
import { emptyPortfolioItem, GALLERY_MAX, makePortfolioItemSchema, portfolioItemToFormValues, portfolioItemToPayload } from './portfolioSchema'
import strings from './strings'

const ITEM_FORM_ID = 'team-portfolio-item-form'

/** Label + hint + error around a control that is not a single form element (the gallery). */
function LabeledGroup({ label, hint, error, children }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={`${id}-label`} aria-describedby={hint ? `${id}-hint` : undefined} className="min-w-0">
      <p id={`${id}-label`} className="mb-1.5 text-[13px] font-semibold text-soft">
        {label}
      </p>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Form of the add / edit dialog. Mounted fresh every time the dialog opens, so it always starts from the right item. */
function ItemForm({ item, onSubmit, onUploadingChange }) {
  const c = useCommon()
  const t = useStrings(strings)
  const schema = useMemo(() => makePortfolioItemSchema(c), [c])
  const [coverBusy, setCoverBusy] = useState(false)
  const [galleryBusy, setGalleryBusy] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: item ? portfolioItemToFormValues(item) : emptyPortfolioItem() })

  useEffect(() => onUploadingChange?.(coverBusy || galleryBusy), [coverBusy, galleryBusy, onUploadingChange])

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(portfolioItemToPayload(values))
    } catch (err) {
      applyServerErrors(setError, err) // 422 → field errors; anything else already produced a toast
    }
  })

  return (
    <form id={ITEM_FORM_ID} onSubmit={submit} noValidate className="space-y-5 pb-2">
      <BilingualField name="title" label={t.portfolioItemTitle} register={register} errors={errors} required maxLength={255} />
      <BilingualField name="description" label={t.portfolioItemDescription} register={register} errors={errors} required multiline rows={4} maxLength={5000} />
      <Controller
        name="cover_image"
        control={control}
        render={({ field }) => (
          <Field label={t.portfolioItemCover} hint={t.portfolioItemCoverHint} error={errors.cover_image}>
            <ImageUpload folder="team-profiles/portfolio" value={field.value} url={item?.cover_image_url} onChange={field.onChange} onUploadingChange={setCoverBusy} />
          </Field>
        )}
      />
      <Controller
        name="gallery"
        control={control}
        render={({ field }) => (
          <LabeledGroup label={t.portfolioItemGallery} hint={t.portfolioItemGalleryHint} error={errors.gallery?.message}>
            <GalleryUpload folder="team-profiles/portfolio" max={GALLERY_MAX} value={field.value} onChange={field.onChange} onUploadingChange={setGalleryBusy} invalid={Boolean(errors.gallery)} />
          </LabeledGroup>
        )}
      />
      <Field label={t.portfolioItemVideo} hint={t.portfolioItemVideoHint} error={errors.video_url}>
        <Input type="url" {...register('video_url')} placeholder="https://youtube.com/watch?v=…" autoComplete="off" />
      </Field>
    </form>
  )
}

function ItemModal({ open, item, onClose, onSubmit, saving }) {
  const c = useCommon()
  const t = useStrings(strings)
  const [uploading, setUploading] = useState(false)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? t.portfolioItemEdit : t.portfolioItemNew}
      size="lg"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {c.cancel}
          </Button>
          <Button type="submit" form={ITEM_FORM_ID} loading={saving} disabled={uploading}>
            {saving ? c.saving : c.save}
          </Button>
        </>
      }
    >
      <ItemForm item={item} onSubmit={onSubmit} onUploadingChange={setUploading} />
    </Modal>
  )
}

/** One line of the portfolio list: drag handle, cover thumbnail, title in both languages, actions. */
function ItemRow({ item, handle, isDragging, deleting, onEdit, onDelete }) {
  const t = useStrings(strings)

  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-white/[.03] px-3 py-2 ${isDragging ? 'border-accent-light' : 'border-white/[.08]'}`}>
      {handle}
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[.05]">
        {item.cover_image_url ? <img src={item.cover_image_url} alt="" className="size-full object-cover" /> : <Briefcase size={16} className="text-muted" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" dir="auto">
          {item.title_en}
        </p>
        <p className="truncate text-xs text-muted" dir="auto">
          {item.title_ar}
        </p>
      </div>
      <IconButton icon={Pencil} label={t.portfolioItemEditAction(item.title_en)} onClick={onEdit} />
      <IconButton icon={Trash2} tone="danger" label={t.portfolioItemDeleteAction(item.title_en)} onClick={onDelete} disabled={deleting} />
    </div>
  )
}

/** The portfolio of one team profile: live CRUD (add / edit in a dialog, delete with confirm, drag to reorder).
 * Reused both by the admin's "edit team member" page and by the signed-in member's own "My portfolio" page —
 * the backend decides who may act on a given `teamId`, this component just calls the same nested endpoint. */
export function PortfolioTab({ teamId }) {
  const t = useStrings(strings)
  const c = useCommon()
  const confirm = useConfirm()
  const { list, create, update, remove, reorder } = useTeamPortfolio(teamId)
  const [dialog, setDialog] = useState({ open: false, item: null })
  const rows = list.rows

  const close = () => setDialog({ open: false, item: null })
  const save = async (payload) => {
    if (dialog.item) await update.mutateAsync({ id: dialog.item.id, data: payload })
    else await create.mutateAsync(payload)
    close()
  }
  const onDelete = async (item) => {
    const ok = await confirm({ title: t.portfolioItemDeleteTitle, message: t.portfolioItemDeleteMessage(item.title_en), confirmLabel: c.delete })
    if (ok) remove.mutate(item.id)
  }

  let body
  if (list.isError && rows.length === 0) {
    body = (
      <Alert tone="danger" title={c.loadFailed} action={<Button size="sm" variant="secondary" onClick={() => list.refetch()}>{c.retry}</Button>}>
        {errorText(list.error, c)}
      </Alert>
    )
  } else if (list.isLoading) {
    body = (
      <div className="flex justify-center py-10 text-accent-lighter">
        <Spinner size={24} label={c.loading} />
      </div>
    )
  } else if (rows.length === 0) {
    body = <EmptyState icon={Briefcase} title={t.portfolioEmptyTitle} description={t.portfolioEmptyHint} />
  } else {
    body = (
      <SortableList
        items={rows}
        ariaLabel={t.portfolioTitle}
        onReorder={(next) => reorder.mutate(next.map((row) => row.id))}
        renderItem={(item, { handle, isDragging }) => (
          <ItemRow item={item} handle={handle} isDragging={isDragging} deleting={remove.isPending} onEdit={() => setDialog({ open: true, item })} onDelete={() => onDelete(item)} />
        )}
      />
    )
  }

  return (
    <>
      <Card
        title={t.portfolioTitle}
        description={t.portfolioDescription}
        actions={
          <Button size="sm" icon={Plus} onClick={() => setDialog({ open: true, item: null })}>
            {t.portfolioItemNew}
          </Button>
        }
      >
        {body}
      </Card>
      <ItemModal open={dialog.open} item={dialog.item} onClose={close} onSubmit={save} saving={create.isPending || update.isPending} />
    </>
  )
}
