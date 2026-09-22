import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import StatCreate from './StatCreate'
import StatEdit from './StatEdit'
import { makeStatSchema } from './schema'

// the label of a required <Field> has a decorative asterisk, so query by role (the accessible name skips it)
const valueBox = () => screen.getByRole('textbox', { name: 'Value' })

const stat = { id: 7, value: '240+', label_ar: 'مشروع منجز', label_en: 'Projects delivered', order: 3 }

const fillAll = async (user) => {
  await user.type(valueBox(), '12')
  await user.type(screen.getByLabelText('Label (Arabic)'), 'سنة خبرة')
  await user.type(screen.getByLabelText('Label (English)'), 'Years of experience')
}

describe('StatCreate', () => {
  it('renders the value box (left-to-right, 20 characters), the label pair and Save / Cancel', () => {
    renderWithProviders(<StatCreate />, { route: '/stats/new' })

    expect(screen.getByRole('heading', { level: 1, name: 'Add a stat' })).toBeInTheDocument()
    expect(valueBox()).toHaveAttribute('dir', 'ltr')
    expect(valueBox()).toHaveAttribute('maxlength', '20')
    expect(screen.getByLabelText('Label (Arabic)')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByLabelText('Label (English)').tagName).toBe('INPUT') // single line
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/stats')
    expect(screen.getByRole('link', { name: 'Stats' })).toHaveAttribute('href', '/stats') // back link
  })

  it('validates required fields locally and sends nothing', async () => {
    const server = mockApi({})
    const { user } = renderWithProviders(<StatCreate />, { route: '/stats/new' })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findAllByText('This field is required')).toHaveLength(3)
    expect(valueBox()).toHaveAttribute('aria-invalid', 'true')
    expect(valueBox()).toHaveFocus()
    expect(server.requests).toHaveLength(0)
  })

  it('rejects a value longer than 20 characters (API limit) without sending', async () => {
    const server = mockApi({})
    const { user } = renderWithProviders(<StatCreate />, { route: '/stats/new' })
    await fillAll(user)

    fireEvent.change(valueBox(), { target: { value: '9'.repeat(21) } }) // bypasses the maxlength attribute
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('At most 20 characters')).toBeInTheDocument()
    expect(server.requests).toHaveLength(0)
  })

  it('creates the stat, toasts and returns to the list', async () => {
    const server = mockApi({ 'POST /stats': ({ body }) => reply(201, { data: { id: 9, ...body } }) })
    const { user } = renderWithProviders(<StatCreate />, { route: '/stats/new' })

    await fillAll(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/stats$/))
    expect(server.calls('POST', '/stats')[0].body).toEqual({ value: '12', label_ar: 'سنة خبرة', label_en: 'Years of experience' })
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('accepts a value of exactly 20 characters and trims whitespace', async () => {
    const server = mockApi({ 'POST /stats': ({ body }) => reply(201, { data: body }) })
    const { user } = renderWithProviders(<StatCreate />, { route: '/stats/new' })

    await user.type(valueBox(), '9'.repeat(20))
    await user.type(screen.getByLabelText('Label (Arabic)'), '  ع  ')
    await user.type(screen.getByLabelText('Label (English)'), '  L  ')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/stats')).toHaveLength(1))
    expect(server.calls('POST', '/stats')[0].body).toEqual({ value: '9'.repeat(20), label_ar: 'ع', label_en: 'L' })
  })

  it('shows the server validation errors on the matching fields and stays on the page', async () => {
    mockApi({
      'POST /stats': () => validationError({ value: ['The value field must not be greater than 20 characters.'], label_ar: ['The label ar field is required.'] }),
    })
    const { user } = renderWithProviders(<StatCreate />, { route: '/stats/new' })
    await fillAll(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('The value field must not be greater than 20 characters.')).toBeInTheDocument()
    expect(screen.getByText('The label ar field is required.')).toBeInTheDocument()
    expect(valueBox()).toHaveAttribute('aria-invalid', 'true')
    expect(valueBox()).toHaveFocus()
    expect(screen.getByTestId('location')).toHaveTextContent('/stats/new')
    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument() // toast
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('disables Save while the request is running', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    mockApi({
      'POST /stats': async () => {
        await gate
        return reply(201, { data: { id: 1 } })
      },
    })
    const { user } = renderWithProviders(<StatCreate />, { route: '/stats/new' })
    await fillAll(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
    release()
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/stats$/))
  })

  it('shows a toast when the server is down (and keeps the form)', async () => {
    mockApi({ 'POST /stats': () => reply(500, { message: 'boom' }) })
    const { user } = renderWithProviders(<StatCreate />, { route: '/stats/new' })
    await fillAll(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    expect(valueBox()).toHaveValue('12')
  })

  it('renders in Arabic with Arabic validation messages', async () => {
    const { user } = renderWithProviders(<StatCreate />, { route: '/stats/new', lang: 'ar' })

    expect(screen.getByRole('heading', { level: 1, name: 'إضافة إحصائية' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'حفظ' }))
    expect((await screen.findAllByText('هذا الحقل مطلوب')).length).toBe(3)
  })
})

describe('stat schema', () => {
  const c = { required: 'required', maxLength: (n) => `max ${n}` }

  it('mirrors the API limits (value 20, labels 255, all required)', () => {
    const schema = makeStatSchema(c)
    const valid = { value: '98%', label_ar: 'ع', label_en: 'L' }
    expect(schema.safeParse(valid).success).toBe(true)
    expect(schema.safeParse({ ...valid, value: '9'.repeat(20) }).success).toBe(true)
    expect(schema.safeParse({ ...valid, value: '9'.repeat(21) }).success).toBe(false)
    expect(schema.safeParse({ ...valid, label_en: 'x'.repeat(256) }).success).toBe(false)
    expect(schema.safeParse({ ...valid, label_ar: '   ' }).success).toBe(false)
    expect(schema.safeParse({ ...valid, value: '' }).success).toBe(false)
  })
})

describe('StatEdit', () => {
  const route = '/stats/7'
  const path = '/stats/:id'

  it('loads the record into the form and keeps Save disabled until something changes', async () => {
    mockApi({ 'GET /stats/:id': () => ({ data: stat }) })
    const { user } = renderWithProviders(<StatEdit />, { route, path })

    expect(await screen.findByRole('textbox', { name: 'Value' })).toHaveValue('240+')
    expect(screen.getByLabelText('Label (Arabic)')).toHaveValue('مشروع منجز')
    expect(screen.getByLabelText('Label (English)')).toHaveValue('Projects delivered')
    expect(screen.getByRole('heading', { level: 1, name: 'Edit stat' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    await user.type(valueBox(), '0')

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('shows a spinner while loading', () => {
    mockApi({ 'GET /stats/:id': () => ({ data: stat }) })
    renderWithProviders(<StatEdit />, { route, path })
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('saves the values with PUT and goes back to the list', async () => {
    const server = mockApi({
      'GET /stats/:id': () => ({ data: stat }),
      'PUT /stats/:id': ({ params, body }) => ({ data: { ...stat, ...body, id: Number(params.id) } }),
    })
    const { user } = renderWithProviders(<StatEdit />, { route, path })
    const value = await screen.findByRole('textbox', { name: 'Value' })

    await user.clear(value)
    await user.type(value, '300+')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/stats$/))
    expect(server.calls('PUT', '/stats/7')[0].body).toEqual({ value: '300+', label_ar: stat.label_ar, label_en: stat.label_en })
  })

  it('shows server errors on an edit too', async () => {
    mockApi({ 'GET /stats/:id': () => ({ data: stat }), 'PUT /stats/:id': () => validationError({ label_en: ['Label is too long.'] }) })
    const { user } = renderWithProviders(<StatEdit />, { route, path })
    await user.type(await screen.findByLabelText('Label (English)'), ' more')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Label is too long.')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/stats/7')
  })

  it('shows "not found" for a missing stat', async () => {
    mockApi({ 'GET /stats/:id': () => reply(404, { message: 'No query results for model [App\\Models\\SiteStat] 7' }) })
    renderWithProviders(<StatEdit />, { route, path })

    expect(await screen.findByText('Stat not found')).toBeInTheDocument()
    expect(screen.queryByText(/App\\Models/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Stats' })).toHaveAttribute('href', '/stats')
  })

  it('offers a retry when loading fails for another reason', async () => {
    const server = mockApi({ 'GET /stats/:id': () => reply(500, { message: 'boom' }) })
    const { user } = renderWithProviders(<StatEdit />, { route, path })

    expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()

    server.on('GET /stats/:id', () => ({ data: stat }))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('textbox', { name: 'Value' })).toBeInTheDocument()
  })
})
