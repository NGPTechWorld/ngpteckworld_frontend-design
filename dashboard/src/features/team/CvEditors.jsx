import { Controller, get, useFieldArray, useWatch } from 'react-hook-form'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useStrings } from '@/i18n'
import { BilingualField, Button, Card, Checkbox, Field, IconButton, Input, Select, fieldErrorMessage } from '@/ui'
import { CV_SECTIONS, LONG_FIELDS, MAX_ENTRIES, MAX_LINKS, PLATFORMS, emptyEntry, emptyLink } from './cvSections'
import strings from './strings'

/** Move up / move down / remove, shared by entries and links. */
function RowActions({ index, count, move, remove, label }) {
  const t = useStrings(strings)
  return (
    <div className="flex shrink-0 items-center gap-1">
      <IconButton icon={ArrowUp} size="sm" label={t.cvMoveUp(label)} onClick={() => move(index, index - 1)} disabled={index === 0} />
      <IconButton icon={ArrowDown} size="sm" label={t.cvMoveDown(label)} onClick={() => move(index, index + 1)} disabled={index === count - 1} />
      <IconButton icon={Trash2} size="sm" tone="danger" label={t.cvRemove(label)} onClick={() => remove(index)} />
    </div>
  )
}

/** Start / end month + "present" of one entry. */
function DateFields({ name, control, register, errors }) {
  const t = useStrings(strings)
  const current = useWatch({ control, name: `${name}.current` })
  return (
    <div className="grid items-end gap-4 sm:grid-cols-3">
      <Field label={t.cvStart} error={fieldErrorMessage(get(errors, `${name}.start`))}>
        <Input type="month" dir="ltr" {...register(`${name}.start`)} />
      </Field>
      <Field label={t.cvEnd} error={fieldErrorMessage(get(errors, `${name}.end`))}>
        <Input type="month" dir="ltr" {...register(`${name}.end`)} disabled={current} />
      </Field>
      <Controller
        name={`${name}.current`}
        control={control}
        render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} label={t.cvCurrent} className="pb-3" />}
      />
    </div>
  )
}

/**
 * One CV section (skills, experience…) as a card with a list of entries, each editable in place in both
 * languages. The shape of an entry comes from CV_SECTIONS; labels and placeholders from strings.cv[section].
 */
export function CvSectionEditor({ section, control, register, errors }) {
  const t = useStrings(strings)
  const spec = CV_SECTIONS[section]
  const text = t.cv[section]
  const { fields, append, remove, move } = useFieldArray({ control, name: section })
  const mainField = Object.keys(spec.fields)[0]
  const entries = useWatch({ control, name: section }) ?? []

  return (
    <Card title={text.title} description={text.description}>
      <div className="space-y-4">
        {fields.length === 0 ? <p className="text-sm text-muted">{text.empty}</p> : null}

        {fields.map((item, index) => {
          const name = `${section}.${index}`
          const label = entries[index]?.[`${mainField}_en`] || entries[index]?.[`${mainField}_ar`] || t.cvEntryN(index + 1)
          return (
            <fieldset key={item.id} aria-label={label} className="space-y-4 rounded-xl border border-white/[.08] bg-white/[.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold" dir="auto">
                  {label}
                </p>
                <RowActions index={index} count={fields.length} move={move} remove={remove} label={label} />
              </div>

              {Object.entries(spec.fields).map(([field, required]) => {
                const long = LONG_FIELDS.includes(field)
                return (
                  <BilingualField
                    key={field}
                    name={`${name}.${field}`}
                    label={text.fields[field]}
                    register={register}
                    errors={errors}
                    required={required}
                    multiline={long}
                    rows={3}
                    maxLength={long ? 5000 : 255}
                    placeholder={text.placeholders?.[field]}
                  />
                )
              })}

              {spec.url ? (
                <Field label={t.cvLink} error={fieldErrorMessage(get(errors, `${name}.url`))}>
                  <Input type="url" dir="ltr" maxLength={255} placeholder="https://…" autoComplete="off" {...register(`${name}.url`)} />
                </Field>
              ) : null}

              {spec.dates ? <DateFields name={name} control={control} register={register} errors={errors} /> : null}
            </fieldset>
          )
        })}

        <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={() => append(emptyEntry(section))} disabled={fields.length >= MAX_ENTRIES}>
          {text.add}
        </Button>
      </div>
    </Card>
  )
}

/** One social link: network, URL and, for "other", its own label. */
function LinkRow({ index, count, control, register, errors, move, remove }) {
  const t = useStrings(strings)
  const platform = useWatch({ control, name: `social_links.${index}.platform` })
  const options = PLATFORMS.map((key) => ({ value: key, label: t.platforms[key] }))
  const label = t.platforms[platform] ?? t.cvEntryN(index + 1)

  return (
    <div className="grid items-start gap-3 rounded-xl border border-white/[.08] bg-white/[.02] p-3 sm:grid-cols-[12rem_1fr_auto]">
      <Field label={t.linkPlatform} error={fieldErrorMessage(get(errors, `social_links.${index}.platform`))}>
        <Select {...register(`social_links.${index}.platform`)} options={options} />
      </Field>
      <div className="grid gap-3">
        <Field label={t.linkUrl} error={fieldErrorMessage(get(errors, `social_links.${index}.url`))} required>
          <Input type="url" dir="ltr" maxLength={255} placeholder="https://…" autoComplete="off" {...register(`social_links.${index}.url`)} />
        </Field>
        {platform === 'other' ? (
          <Field label={t.linkLabel} hint={t.linkLabelHint} error={fieldErrorMessage(get(errors, `social_links.${index}.label`))}>
            <Input maxLength={60} autoComplete="off" {...register(`social_links.${index}.label`)} />
          </Field>
        ) : null}
      </div>
      <div className="sm:pt-7">
        <RowActions index={index} count={count} move={move} remove={remove} label={label} />
      </div>
    </div>
  )
}

/** The profile's social links: as many as needed, any network, in the order they are shown. */
export function SocialLinksEditor({ control, register, errors }) {
  const t = useStrings(strings)
  const { fields, append, remove, move } = useFieldArray({ control, name: 'social_links' })

  return (
    <Card title={t.sectionLinks} description={t.linksDescription}>
      <div className="space-y-3">
        {fields.length === 0 ? <p className="text-sm text-muted">{t.linksEmpty}</p> : null}
        {fields.map((item, index) => (
          <LinkRow key={item.id} index={index} count={fields.length} control={control} register={register} errors={errors} move={move} remove={remove} />
        ))}
        <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={() => append(emptyLink())} disabled={fields.length >= MAX_LINKS}>
          {t.linkAdd}
        </Button>
      </div>
    </Card>
  )
}
