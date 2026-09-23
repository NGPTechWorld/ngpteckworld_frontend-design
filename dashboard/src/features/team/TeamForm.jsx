import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/app/AuthProvider'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { users } from '@/features/users/hooks'
import { BilingualField, BilingualTags, Card, Field, FormActions, ImageUpload, Input, Select, Switch } from '@/ui'
import { emptyTeamProfile, makeTeamProfileSchema } from './schema'
import strings from './strings'

/**
 * Create / edit form. `onSubmit(values)` must return a promise: when it rejects with a 422 the server's field
 * errors are put on the matching inputs; any other error already produced a toast (crud hook).
 * On edit forms `isEdit` keeps Save disabled until something changed. `avatarUrl` is the absolute URL of the
 * saved photo (`record.avatar_url`), used only for the preview; the form value is the relative path.
 */
export function TeamForm({ defaultValues = emptyTeamProfile, avatarUrl, onSubmit, saving = false, isEdit = false }) {
  const c = useCommon()
  const t = useStrings(strings)
  const schema = useMemo(() => makeTeamProfileSchema(c), [c])
  const [uploading, setUploading] = useState(false)
  // Linking a profile to a dashboard account is a super-admin-only capability (same gate as /users itself):
  // a limited admin with only the "team" permission cannot list accounts, so this field is hidden for them
  // instead of firing a request they are not allowed to make.
  const { user: currentUser } = useAuth()
  const canLinkAccount = Boolean(currentUser?.is_super_admin)
  const usersQuery = users.useList({ per_page: 200, sort: 'name' }, { enabled: canLinkAccount })
  const userOptions = useMemo(
    () => [{ value: '', label: t.linkedAccountNone }, ...usersQuery.rows.map((u) => ({ value: String(u.id), label: `${u.name} (${u.email})` }))],
    [usersQuery.rows, t.linkedAccountNone],
  )
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
      <Card title={t.sectionPersonal}>
        <div className="space-y-6">
          <BilingualField name="name" label={t.name} register={register} errors={errors} required maxLength={255} placeholder={{ ar: 'سارة أحمد', en: 'Sara Ahmad' }} />
          <Controller
            name="avatar"
            control={control}
            render={({ field }) => (
              <Field label={t.avatar} error={errors.avatar}>
                <ImageUpload shape="circle" folder="team-profiles" value={field.value} url={avatarUrl} alt={t.avatar} onChange={field.onChange} onUploadingChange={setUploading} />
              </Field>
            )}
          />
          <BilingualField
            name="bio" label={t.bio} register={register} errors={errors} required multiline rows={4} maxLength={5000}
            placeholder={{ ar: 'نبذة قصيرة عن الشخص وخبرته واهتماماته المهنية...', en: 'A short bio about this person, their experience and interests...' }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.email} error={errors.email} hint={t.emailHint}>
              <Input {...register('email')} type="email" dir="ltr" maxLength={255} placeholder="sara@ngptechworld.com" autoComplete="off" />
            </Field>
            <Field label={t.phone} error={errors.phone} hint={t.phoneHint}>
              <Input {...register('phone')} dir="ltr" maxLength={40} placeholder="+963 933 000 111" autoComplete="off" />
            </Field>
          </div>
          <BilingualField name="location" label={t.location} register={register} errors={errors} maxLength={255} placeholder={{ ar: 'دمشق، سوريا', en: 'Damascus, Syria' }} />
        </div>
      </Card>

      <Card title={t.sectionWork}>
        <div className="space-y-6">
          <BilingualField name="job_title" label={t.jobTitle} register={register} errors={errors} required maxLength={255} placeholder={{ ar: 'مهندسة برمجيات', en: 'Software Engineer' }} />
          <BilingualField name="department" label={t.department} register={register} errors={errors} maxLength={255} placeholder={{ ar: 'الهندسة', en: 'Engineering' }} />
          <Field label={t.yearsExperience} error={errors.years_experience} className="sm:w-56">
            <Input {...register('years_experience')} type="number" min={0} max={80} inputMode="numeric" placeholder="5" />
          </Field>
        </div>
      </Card>

      <Card title={t.sectionCv}>
        <div className="space-y-6">
          <BilingualTags name="skills" label={t.skills} hint={t.skillsHint} control={control} errors={errors} placeholder={{ ar: 'React', en: 'React' }} />
          <BilingualTags
            name="education" label={t.education} hint={t.educationHint} control={control} errors={errors}
            placeholder={{ ar: 'بكالوريوس هندسة معلوماتية — جامعة دمشق، 2018', en: 'BSc in Software Engineering — Damascus University, 2018' }}
          />
          <BilingualTags
            name="experience" label={t.experience} hint={t.experienceHint} control={control} errors={errors}
            placeholder={{ ar: 'مطوّر واجهات أمامية — شركة X، 2019–2021', en: 'Frontend Developer — Company X, 2019–2021' }}
          />
          <BilingualTags name="certifications" label={t.certifications} control={control} errors={errors} placeholder={{ ar: 'AWS Certified Developer', en: 'AWS Certified Developer' }} />
          <BilingualTags name="languages" label={t.languages} control={control} errors={errors} placeholder={{ ar: 'العربية', en: 'Arabic' }} />
        </div>
      </Card>

      <Card title={t.sectionLinks}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.linkedin} error={errors.linkedin_url}>
            <Input {...register('linkedin_url')} type="url" dir="ltr" maxLength={255} placeholder="https://linkedin.com/in/…" autoComplete="off" />
          </Field>
          <Field label={t.github} error={errors.github_url}>
            <Input {...register('github_url')} type="url" dir="ltr" maxLength={255} placeholder="https://github.com/…" autoComplete="off" />
          </Field>
          <Field label={t.website} error={errors.website_url}>
            <Input {...register('website_url')} type="url" dir="ltr" maxLength={255} placeholder="https://example.com" autoComplete="off" />
          </Field>
          <Field label={t.twitter} error={errors.twitter_url}>
            <Input {...register('twitter_url')} type="url" dir="ltr" maxLength={255} placeholder="https://x.com/…" autoComplete="off" />
          </Field>
        </div>
      </Card>

      <Card title={t.sectionStatus}>
        <div className="space-y-6">
          <Field label={t.slug} error={errors.slug} hint={t.slugHint}>
            <Input {...register('slug')} dir="ltr" maxLength={255} placeholder="sara-ahmad" autoComplete="off" />
          </Field>
          {canLinkAccount ? (
            <Field label={t.linkedAccount} error={errors.user_id} hint={t.linkedAccountHint}>
              <Select {...register('user_id')} options={userOptions} />
            </Field>
          ) : null}
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label={t.activeLabel} description={t.activeHint} />}
          />
        </div>
      </Card>

      <FormActions saving={saving} disabled={uploading} dirty={isEdit ? isDirty : undefined} cancelTo="/team" />
    </form>
  )
}
