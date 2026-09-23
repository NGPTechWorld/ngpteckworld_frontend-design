import { Controller, get } from 'react-hook-form'
import { useCommon } from '@/i18n'
import { cx } from '@/lib/cx'
import { Field } from './Field'
import { Input } from './Input'
import { TagsInput } from './TagsInput'
import { Textarea } from './Textarea'

const LANGS = ['ar', 'en']

/** Message of whatever react-hook-form stored for a path: a FieldError, or an array of them (list fields). */
export function fieldErrorMessage(error) {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (error.message) return error.message
  if (Array.isArray(error)) return error.map(fieldErrorMessage).find(Boolean) || ''
  return error.root?.message || ''
}

function Group({ label, required, hint, className, children }) {
  return (
    <fieldset className={cx('min-w-0', className)}>
      {label ? (
        <legend className="mb-2 flex items-center gap-1 text-[13px] font-semibold text-soft">
          {label}
          {required ? (
            <span aria-hidden="true" className="text-gold">
              *
            </span>
          ) : null}
        </legend>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </fieldset>
  )
}

/**
 * Arabic + English pair of one content field, each side with the right `dir`/`lang`.
 *
 * react-hook-form mode (normal): fields are `${name}_ar` and `${name}_en` in the API.
 *   <BilingualField name="question" label="Question" register={register} errors={errors} required />
 *   <BilingualField name="answer" label="Answer" register={register} errors={errors} multiline rows={5} />
 * `name` may be a nested path ("items.0.title" → items.0.title_ar).
 *
 * Controlled mode (no RHF): value={{ ar, en }} onChange={({ ar, en }) => …} error={{ ar, en }}.
 */
export function BilingualField({
  name,
  label,
  register,
  errors,
  hint,
  required = false,
  multiline = false,
  rows = 4,
  maxLength,
  placeholder,
  disabled,
  value,
  onChange,
  error,
  className,
}) {
  const c = useCommon()
  const Control = multiline ? Textarea : Input
  const langName = { ar: c.arabic, en: c.english }

  return (
    <Group label={label} required={required} hint={hint} className={className}>
      {LANGS.map((lang) => {
        const message = register ? fieldErrorMessage(get(errors, `${name}_${lang}`)) : fieldErrorMessage(error?.[lang])
        const ariaLabel = typeof label === 'string' ? `${label} (${langName[lang]})` : undefined
        const props = register
          ? register(`${name}_${lang}`)
          : { value: value?.[lang] ?? '', onChange: (event) => onChange?.({ ar: value?.ar ?? '', en: value?.en ?? '', [lang]: event.target.value }) }

        return (
          <Field key={lang} label={langName[lang]} error={message} labelClassName="text-xs font-medium text-muted">
            <Control
              {...props}
              {...(multiline ? { rows } : {})}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              lang={lang}
              maxLength={maxLength}
              placeholder={placeholder?.[lang] ?? (typeof placeholder === 'string' ? placeholder : undefined)}
              disabled={disabled}
              aria-label={ariaLabel}
            />
          </Field>
        )
      })}
    </Group>
  )
}

/**
 * Arabic + English list of short strings (features, tasks): `${name}_ar` / `${name}_en` hold string[].
 *   <BilingualTags name="features" label="Features" control={control} errors={errors} />
 * `placeholder` may be one string for both sides, or `{ ar, en }` for a different example per language.
 */
export function BilingualTags({ name, label, control, errors, hint, max, placeholder, disabled, className }) {
  const c = useCommon()
  const langName = { ar: c.arabic, en: c.english }

  return (
    <Group label={label} hint={hint} className={className}>
      {LANGS.map((lang) => (
        <Controller
          key={lang}
          name={`${name}_${lang}`}
          control={control}
          render={({ field }) => (
            <Field label={langName[lang]} error={fieldErrorMessage(get(errors, `${name}_${lang}`))} labelClassName="text-xs font-medium text-muted">
              <TagsInput
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                value={field.value ?? []}
                onChange={field.onChange}
                max={max}
                placeholder={placeholder?.[lang] ?? (typeof placeholder === 'string' ? placeholder : undefined)}
                disabled={disabled}
                aria-label={typeof label === 'string' ? `${label} (${langName[lang]})` : undefined}
              />
            </Field>
          )}
        />
      ))}
    </Group>
  )
}
