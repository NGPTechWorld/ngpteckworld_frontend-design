import { zodResolver } from '@hookform/resolvers/zod'
import { screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { renderWithProviders } from '@/test/renderWithProviders'
import { BilingualField, BilingualTags, fieldErrorMessage } from './BilingualField'
import { Button } from './Button'

function Form({ onSubmit = () => {}, multiline = false, defaults = {}, serverError }) {
  const schema = z.object({ title_ar: z.string().min(1, 'Arabic is required'), title_en: z.string().min(1, 'English is required') })
  const { register, handleSubmit, setError, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { title_ar: '', title_en: '', ...defaults } })
  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => {
        if (serverError) setError('title_en', { type: 'server', message: serverError })
        else onSubmit(values)
      })}
    >
      <BilingualField name="title" label="Title" register={register} errors={errors} multiline={multiline} required hint="Shown on the site" />
      <Button type="submit">Send</Button>
    </form>
  )
}

describe('BilingualField (react-hook-form mode)', () => {
  it('renders an Arabic RTL and an English LTR control, each with a precise accessible name', () => {
    renderWithProviders(<Form />)

    const ar = screen.getByLabelText('Title (Arabic)')
    const en = screen.getByLabelText('Title (English)')
    expect(ar).toHaveAttribute('dir', 'rtl')
    expect(ar).toHaveAttribute('lang', 'ar')
    expect(en).toHaveAttribute('dir', 'ltr')
    expect(en).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('group', { name: /Title/ })).toBeInTheDocument()
    expect(screen.getByText('Shown on the site')).toBeInTheDocument()
  })

  it('uses textareas when multiline', () => {
    renderWithProviders(<Form multiline />)
    expect(screen.getByLabelText('Title (Arabic)').tagName).toBe('TEXTAREA')
  })

  it('submits `${name}_ar` and `${name}_en` values', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithProviders(<Form onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Title (Arabic)'), 'عنوان')
    await user.type(screen.getByLabelText('Title (English)'), 'Title')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(onSubmit).toHaveBeenCalledWith({ title_ar: 'عنوان', title_en: 'Title' })
  })

  it('shows validation errors under the matching side and marks it invalid', async () => {
    const { user } = renderWithProviders(<Form defaults={{ title_ar: 'عنوان' }} />)

    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByText('English is required')).toBeInTheDocument()
    expect(screen.queryByText('Arabic is required')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Title (English)')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Title (English)')).toHaveAccessibleDescription(/English is required/)
    expect(screen.getByLabelText('Title (Arabic)')).not.toHaveAttribute('aria-invalid')
  })

  it('shows errors set from the server (setError)', async () => {
    const { user } = renderWithProviders(<Form defaults={{ title_ar: 'أ', title_en: 'a' }} serverError="Already taken" />)
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('Already taken')).toBeInTheDocument()
  })

  it('names the sides in Arabic when the UI is Arabic', () => {
    renderWithProviders(<Form />, { lang: 'ar' })
    expect(screen.getByLabelText('Title (العربية)')).toBeInTheDocument()
    expect(screen.getByLabelText('Title (English)')).toBeInTheDocument()
  })
})

describe('BilingualField (controlled mode)', () => {
  it('reads and writes { ar, en }', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<BilingualField label="Name" value={{ ar: 'س', en: 'S' }} onChange={onChange} error={{ en: 'Bad English' }} />)

    expect(screen.getByLabelText('Name (Arabic)')).toHaveValue('س')
    expect(screen.getByText('Bad English')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Name (English)'), 'x')
    expect(onChange).toHaveBeenLastCalledWith({ ar: 'س', en: 'Sx' })
  })
})

describe('BilingualTags', () => {
  function TagsForm({ onSubmit }) {
    const { control, handleSubmit, formState: { errors } } = useForm({ defaultValues: { features_ar: ['سريع'], features_en: [] } })
    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <BilingualTags name="features" label="Features" control={control} errors={errors} />
        <Button type="submit">Send</Button>
      </form>
    )
  }

  it('edits both lists independently', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithProviders(<TagsForm onSubmit={onSubmit} />)

    expect(screen.getByText('سريع')).toBeInTheDocument()
    const en = screen.getByLabelText('Features (English)')
    await user.type(en, 'Fast{Enter}Secure{Enter}')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(onSubmit).toHaveBeenCalledWith({ features_ar: ['سريع'], features_en: ['Fast', 'Secure'] }, expect.anything())
  })
})

describe('fieldErrorMessage', () => {
  it('understands strings, FieldErrors and arrays of them', () => {
    expect(fieldErrorMessage('x')).toBe('x')
    expect(fieldErrorMessage({ message: 'm' })).toBe('m')
    expect(fieldErrorMessage([undefined, { message: 'second' }])).toBe('second')
    expect(fieldErrorMessage({ root: { message: 'r' } })).toBe('r')
    expect(fieldErrorMessage(undefined)).toBe('')
  })
})
