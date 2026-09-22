import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Controller, get, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'react-router-dom'
import { FileText, Images, Link2, Lock, Save, Users } from 'lucide-react'
import { useCommon, useFormat, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { Alert, BilingualField, Button, Card, EmptyState, Field, FormActions, GalleryUpload, ImageUpload, Input, Select, Switch, TabPanel, Tabs, fieldErrorMessage } from '@/ui'
import { LinksTab } from './LinksTab'
import { TeamTab } from './TeamTab'
import { CATEGORIES, GALLERY_MAX, STATUSES, TAB_FIELDS, changedPayload, emptyProject, makeProjectSchema, toFormValues, toPayload } from './schema'
import strings from './strings'

const FORM_ID = 'project-form'
const TAB_KEYS = ['general', 'media', 'team', 'links']
const PREFIX = 'project'

const tabOfField = (name) => Object.keys(TAB_FIELDS).find((key) => TAB_FIELDS[key].some((field) => name === field || name.startsWith(`${field}.`)))
const countErrors = (errors, fields) => fields.filter((name) => get(errors, name)).length

/** Active tab lives in the URL (`?tab=team`) so links, refresh and the redirect after "create" can target a tab. */
function useActiveTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('tab')
  const tab = TAB_KEYS.includes(raw) ? raw : 'general'
  const setTab = useCallback(
    (next) =>
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current)
          if (next === 'general') params.delete('tab')
          else params.set('tab', next)
          return params
        },
        { replace: true },
      ),
    [setSearchParams],
  )
  return [tab, setTab]
}

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

/** What the Team / Links tabs show on the create page: nothing can be attached to a project that does not exist yet. */
function SaveFirst({ description, busy, saving }) {
  const t = useStrings(strings)
  return (
    <Card>
      <EmptyState
        icon={Lock}
        title={t.saveFirstTitle}
        description={description}
        action={
          <Button type="submit" form={FORM_ID} icon={Save} loading={saving} disabled={busy}>
            {t.saveAndContinue}
          </Button>
        }
      />
    </Card>
  )
}

/**
 * The whole project in ONE react-hook-form instance, split over tabs:
 *   General + Media  → the form (saved with the Save button; both panels stay mounted so their values and server
 *                      errors survive tab switches, and the tabs show an error count);
 *   Team + Links     → live nested CRUD on the existing project (their own modals and requests, no Save button).
 *
 * `onSubmit(payload)` returns a promise. Create sends every field; edit sends only the changed ones and, when the
 * promise resolves with the saved record, the form is re-based on it (an explicit reset after a save — never on a
 * background refetch, so what the user is typing is not replaced).
 */
export function ProjectForm({ project, defaultValues = emptyProject(), onSubmit, saving = false, isEdit = false }) {
  const c = useCommon()
  const t = useStrings(strings)
  const f = useFormat()
  const schema = useMemo(() => makeProjectSchema(c, t), [c, t])
  const [tab, setTab] = useActiveTab()
  const [coverBusy, setCoverBusy] = useState(false)
  const [galleryBusy, setGalleryBusy] = useState(false)
  const baseline = useRef(defaultValues)
  const pendingFocus = useRef(null)
  const uploading = coverBusy || galleryBusy

  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues })

  // Failed submit (client or server): if the open tab has no error, jump to the tab of the first one and focus it.
  const reveal = (names) => {
    const first = names.find((name) => tabOfField(name))
    if (!first || names.some((name) => tabOfField(name) === tab)) return
    pendingFocus.current = first
    setTab(tabOfField(first))
  }
  useEffect(() => {
    if (!pendingFocus.current) return
    setFocus(pendingFocus.current)
    pendingFocus.current = null
  }, [tab, setFocus])

  const submit = handleSubmit(
    async (values) => {
      try {
        const saved = await onSubmit(isEdit ? changedPayload(baseline.current, values) : toPayload(values))
        if (isEdit && saved) {
          const next = toFormValues(saved)
          baseline.current = next
          reset(next)
        }
      } catch (err) {
        if (applyServerErrors(setError, err)) reveal(Object.keys(err.errors))
      }
    },
    (fieldErrors) => reveal(Object.keys(fieldErrors)),
  )

  const errorBadge = (count) =>
    count ? (
      <>
        <span aria-hidden="true" className="text-danger">
          {f.number(count)}
        </span>
        <span className="sr-only"> {t.tabErrors(count)}</span>
      </>
    ) : undefined

  const tabs = [
    { key: 'general', label: t.tabGeneral, icon: FileText, badge: errorBadge(countErrors(errors, TAB_FIELDS.general)) },
    { key: 'media', label: t.tabMedia, icon: Images, badge: errorBadge(countErrors(errors, TAB_FIELDS.media)) },
    { key: 'team', label: t.tabTeam, icon: isEdit ? Users : Lock, badge: isEdit ? f.number(project?.team_members_count ?? 0) : undefined },
    { key: 'links', label: t.tabLinks, icon: isEdit ? Link2 : Lock, badge: isEdit ? f.number(project?.links_count ?? 0) : undefined },
  ]
  const isFormTab = tab === 'general' || tab === 'media'

  const categoryOptions = CATEGORIES.map((value) => ({ value, label: t.categories[value] }))
  const statusOptions = STATUSES.map((value) => ({ value, label: t.projectStatuses[value] }))

  return (
    <div className="space-y-5">
      <Tabs idPrefix={PREFIX} tabs={tabs} value={tab} onChange={setTab} label={t.tabsLabel} />

      {/* the form covers only General + Media: Team and Links (below) are saved live, so no Save button there */}
      <form id={FORM_ID} onSubmit={submit} noValidate hidden={!isFormTab} className="space-y-5">
        <TabPanel idPrefix={PREFIX} value="general" active={tab} keepMounted className="space-y-5">
          <Card title={t.basicInfo}>
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={t.slug} hint={isEdit ? t.slugHintEdit : t.slugHintCreate} error={errors.slug} className="md:col-span-2">
                  <Input {...register('slug')} dir="ltr" placeholder="acme-portal" autoComplete="off" autoCapitalize="none" spellCheck={false} />
                </Field>
                <Field label={t.category} required error={errors.category}>
                  <Select {...register('category')} placeholder={t.categoryPlaceholder} options={categoryOptions} />
                </Field>
                <Field label={c.status} required error={errors.status}>
                  <Select {...register('status')} options={statusOptions} />
                </Field>
                <Field label={t.client} required error={errors.client}>
                  <Input {...register('client')} dir="auto" />
                </Field>
                <Field label={t.year} required error={errors.year}>
                  <Input type="number" inputMode="numeric" min={1990} max={2100} {...register('year')} />
                </Field>
              </div>
              <Controller
                name="featured"
                control={control}
                render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label={t.featured} description={t.featuredHint} />}
              />
            </div>
          </Card>
          <Card>
            <div className="space-y-6">
              <BilingualField name="name" label={t.name} register={register} errors={errors} required maxLength={255} />
              <BilingualField name="short" label={t.short} hint={t.shortHint} register={register} errors={errors} required maxLength={255} />
              <BilingualField name="description" label={t.descriptionField} register={register} errors={errors} required multiline rows={8} maxLength={10000} />
            </div>
          </Card>
        </TabPanel>

        <TabPanel idPrefix={PREFIX} value="media" active={tab} keepMounted>
          <Card>
            <div className="space-y-8">
              <Controller
                name="cover_image"
                control={control}
                render={({ field }) => (
                  <Field label={t.cover} hint={t.coverHint} error={errors.cover_image}>
                    <ImageUpload folder="projects" value={field.value} url={project?.cover_image_url} onChange={field.onChange} onUploadingChange={setCoverBusy} />
                  </Field>
                )}
              />
              <Controller
                name="gallery"
                control={control}
                render={({ field }) => (
                  <LabeledGroup label={t.gallery} hint={t.galleryHint} error={fieldErrorMessage(errors.gallery)}>
                    <GalleryUpload folder="projects/gallery" max={GALLERY_MAX} value={field.value} onChange={field.onChange} onUploadingChange={setGalleryBusy} invalid={Boolean(errors.gallery)} />
                  </LabeledGroup>
                )}
              />
              <Field label={t.video} hint={t.videoHint} error={errors.video_url}>
                <Input type="url" {...register('video_url')} placeholder={t.videoPlaceholder} autoComplete="off" />
              </Field>
            </div>
          </Card>
        </TabPanel>

        <FormActions saving={saving} dirty={isEdit ? isDirty : undefined} disabled={uploading} cancelTo="/projects" sticky />
      </form>

      {isEdit && !isFormTab && isDirty ? <Alert tone="warning">{t.unsavedOnNested}</Alert> : null}

      <TabPanel idPrefix={PREFIX} value="team" active={tab}>
        {isEdit ? <TeamTab projectId={project.id} /> : <SaveFirst description={t.saveFirstTeam} busy={uploading} saving={saving} />}
      </TabPanel>
      <TabPanel idPrefix={PREFIX} value="links" active={tab}>
        {isEdit ? <LinksTab projectId={project.id} /> : <SaveFirst description={t.saveFirstLinks} busy={uploading} saving={saving} />}
      </TabPanel>
    </div>
  )
}
