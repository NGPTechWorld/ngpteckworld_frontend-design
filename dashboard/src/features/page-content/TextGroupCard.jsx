import { memo, useId } from 'react'
import { useFormState, useWatch } from 'react-hook-form'
import { Undo2 } from 'lucide-react'
import { useCommon, useLanguage, useStrings } from '@/i18n'
import { cx } from '@/lib/cx'
import { Badge, Card, Field, IconButton, Input, Textarea, flipRtl } from '@/ui'
import { labelOf } from './layout'
import { LANGS, MAX_TEXT_LENGTH, charCount } from './schema'
import strings from './strings'

/** "n / 2000" under a field; only this small component re-renders while typing. */
function CharCounter({ control, name }) {
  const t = useStrings(strings)
  const count = charCount(useWatch({ control, name }))
  const tone = count > MAX_TEXT_LENGTH ? 'font-semibold text-danger' : count >= MAX_TEXT_LENGTH * 0.9 ? 'text-warning' : 'text-faint'
  return (
    <div className="mt-1 flex justify-end">
      <span dir="ltr" className={cx('text-[11px] tabular-nums', tone)}>
        {t.charCount(count, MAX_TEXT_LENGTH)}
      </span>
    </div>
  )
}

/**
 * One editable text: label, where it appears on the site, and the Arabic / English inputs.
 * The form lives in the page (`control`, `register`, `resetField` are stable references, so `memo` keeps the other
 * 38 texts from re-rendering); `readOnly` freezes the inputs while a save is running.
 */
export const TextItem = memo(function TextItem({ item, control, register, resetField, readOnly = false }) {
  const c = useCommon()
  const t = useStrings(strings)
  const { lang } = useLanguage()
  const id = useId()
  const label = labelOf(item, lang)
  const hint = t.keyHints[item.key]
  const langName = { ar: c.arabic, en: c.english }
  const Control = item.type === 'textarea' ? Textarea : Input

  const { dirtyFields, errors } = useFormState({ control, name: [`texts.${item.key}.ar`, `texts.${item.key}.en`] })
  const flags = dirtyFields.texts?.[item.key]
  const dirty = Boolean(flags?.ar || flags?.en)

  const revert = () => LANGS.forEach((code) => resetField(`texts.${item.key}.${code}`))

  return (
    <div role="group" aria-labelledby={`${id}-label`} aria-describedby={hint ? `${id}-hint` : undefined} className="py-5 first:pt-0 last:pb-0">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p id={`${id}-label`} className="text-sm font-semibold text-ink">
              {label}
            </p>
            {dirty ? (
              <Badge tone="gold" dot>
                {t.edited}
              </Badge>
            ) : null}
          </div>
          {hint ? (
            <p id={`${id}-hint`} className="mt-0.5 text-xs text-muted">
              {hint}
            </p>
          ) : null}
        </div>
        {dirty ? <IconButton icon={Undo2} size="sm" label={t.revertItem(label)} onClick={revert} disabled={readOnly} className={flipRtl} /> : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {LANGS.map((code) => {
          const name = `texts.${item.key}.${code}`
          return (
            <Field key={code} label={langName[code]} error={errors.texts?.[item.key]?.[code]} labelClassName="text-xs font-medium text-muted">
              <Control
                {...register(name)}
                dir={code === 'ar' ? 'rtl' : 'ltr'}
                lang={code}
                readOnly={readOnly}
                placeholder={t.emptyPlaceholder}
                aria-label={`${label} (${langName[code]})`}
              />
              <CharCounter control={control} name={name} />
            </Field>
          )
        })}
      </div>
    </div>
  )
})

/** A group of the API (e.g. "Home page — hero") as a card listing its texts. */
export function TextGroupCard({ group, control, register, resetField, readOnly }) {
  const { lang } = useLanguage()
  return (
    <Card title={labelOf(group, lang)}>
      <div className="divide-y divide-white/[.07]">
        {group.items.map((item) => (
          <TextItem key={item.key} item={item} control={control} register={register} resetField={resetField} readOnly={readOnly} />
        ))}
      </div>
    </Card>
  )
}
