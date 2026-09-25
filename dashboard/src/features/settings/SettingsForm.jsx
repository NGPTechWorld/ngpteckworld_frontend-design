import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link2, Mail, MessageCircle, Phone } from 'lucide-react'
import { useCommon, useStrings } from '@/i18n'
import { applyServerErrors } from '@/lib/applyServerErrors'
import { Alert, Card, Field, FormActions, Input, Switch } from '@/ui'
import { EXAMPLES, SECTION_GROUPS, SOCIALS, makeSettingsSchema, toFormValues, toPayload } from './schema'
import strings from './strings'

/**
 * One form for the whole settings row. `onSubmit(payload)` receives only the changed fields (see toPayload) and must
 * resolve with the saved settings: the form is then reset to them, so Save is disabled again until the next edit.
 * A 422 puts the server's messages on the matching fields (`applyServerErrors`); other failures were toasted already.
 */
export function SettingsForm({ defaultValues, onSubmit, saving = false, visitors = 0 }) {
  const c = useCommon()
  const t = useStrings(strings)
  const schema = useMemo(() => makeSettingsSchema(c), [c])
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, dirtyFields },
  } = useForm({ resolver: zodResolver(schema), defaultValues })

  // Reflects what the site is doing right now, which the two inputs alone do not say: a switch
  // that is on with a moment already past looks identical to one that is actively holding the
  // site closed.
  const launchEnabled = useWatch({ control, name: 'launch_enabled' })
  const launchAt = useWatch({ control, name: 'launch_at' })
  const launchState = useMemo(() => {
    if (!launchEnabled || !launchAt) return null
    const at = new Date(launchAt).getTime()
    if (Number.isNaN(at)) return null
    return at > Date.now()
      ? { tone: 'warning', text: t.launchLive }
      : { tone: 'success', text: t.launchPassed }
  }, [launchEnabled, launchAt, t])

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

      <Card title={t.sectionsTitle} description={t.sectionsDescription}>
        <div className="space-y-6">
          {[
            ['pages', t.sectionsPages, t.sectionsPagesHint],
            ['home', t.sectionsHome, null],
          ].map(([group, heading, hint]) => (
            <fieldset key={group}>
              <legend className="mb-1 text-sm font-semibold text-ink">{heading}</legend>
              {hint ? <p className="text-xs text-muted">{hint}</p> : null}
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {SECTION_GROUPS[group].map((key) => (
                  <Controller
                    key={key}
                    name={`sections.${key}`}
                    control={control}
                    render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label={t.sections[key]} description={t.sectionHints[key]} />}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </Card>

      <Card title={t.sectionVisitors} description={t.visitorsHint}>
        <div className="space-y-4">
          <Controller
            name="visitor_counter_enabled"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} label={t.visitorsEnabled} description={t.visitorsEnabledHint} />
            )}
          />
          {/* The number is shown whether the switch is on or off: deciding whether it is worth
              publishing is the reason to look at this card at all. */}
          <Alert tone="info">{t.visitorsSoFar(new Intl.NumberFormat('en').format(visitors))}</Alert>
        </div>
      </Card>

      <Card title={t.sectionLaunch} description={t.launchHint}>
        <div className="space-y-6">
          <Controller
            name="launch_enabled"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} label={t.launchEnabled} description={t.launchEnabledHint} />
            )}
          />

          <Field label={t.launchAt} error={errors.launch_at} hint={t.launchAtHint}>
            {/* datetime-local, so the admin types the wall-clock time they mean; schema.js converts
                it to a real instant on the way to the API and back again on the way in. */}
            <Input type="datetime-local" {...register('launch_at')} dir="ltr" />
          </Field>

          {launchState ? <Alert tone={launchState.tone}>{launchState.text}</Alert> : null}
        </div>
      </Card>

      <FormActions saving={saving} dirty={isDirty} onCancel={isDirty ? () => reset() : undefined} cancelLabel={t.discard} />
    </form>
  )
}
