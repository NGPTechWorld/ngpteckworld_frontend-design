import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import FaqCreate from './FaqCreate'
import FaqEdit from './FaqEdit'

const faq = {
  id: 7,
  question_ar: 'ما هي مدة التنفيذ؟',
  question_en: 'How long does it take?',
  answer_ar: 'من أسبوعين إلى ثلاثة أشهر.',
  answer_en: 'Two weeks to three months.',
  is_active: true,
  order: 3,
}

const fillAll = async (user) => {
  await user.type(screen.getByLabelText('Question (Arabic)'), 'سؤال')
  await user.type(screen.getByLabelText('Question (English)'), 'A question?')
  await user.type(screen.getByLabelText('Answer (Arabic)'), 'جواب')
  await user.type(screen.getByLabelText('Answer (English)'), 'An answer')
}

describe('FaqCreate', () => {
  it('renders Arabic and English pairs, an active switch (on by default) and Save / Cancel', () => {
    renderWithProviders(<FaqCreate />, { route: '/faqs/new' })

    expect(screen.getByRole('heading', { level: 1, name: 'Add a question' })).toBeInTheDocument()
    expect(screen.getByLabelText('Question (Arabic)')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByLabelText('Answer (English)').tagName).toBe('TEXTAREA')
    expect(screen.getByRole('switch', { name: /Active/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/faqs')
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faqs') // back link
  })

  it('validates required fields locally and sends nothing', async () => {
    const server = mockApi({})
    const { user } = renderWithProviders(<FaqCreate />, { route: '/faqs/new' })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findAllByText('This field is required')).toHaveLength(4)
    expect(screen.getByLabelText('Question (Arabic)')).toHaveAttribute('aria-invalid', 'true')
    expect(server.requests).toHaveLength(0)
  })

  it('creates the question, toasts and returns to the list', async () => {
    const server = mockApi({ 'POST /faqs': ({ body }) => reply(201, { data: { id: 9, ...body } }) })
    const { user } = renderWithProviders(<FaqCreate />, { route: '/faqs/new' })

    await fillAll(user)
    await user.click(screen.getByRole('switch', { name: /Active/ })) // turn it off
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/faqs$/))
    expect(server.calls('POST', '/faqs')[0].body).toEqual({
      question_ar: 'سؤال',
      question_en: 'A question?',
      answer_ar: 'جواب',
      answer_en: 'An answer',
      is_active: false,
    })
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('trims whitespace before sending', async () => {
    const server = mockApi({ 'POST /faqs': ({ body }) => reply(201, { data: body }) })
    const { user } = renderWithProviders(<FaqCreate />, { route: '/faqs/new' })

    await user.type(screen.getByLabelText('Question (Arabic)'), '  سؤال  ')
    await user.type(screen.getByLabelText('Question (English)'), '  Q?  ')
    await user.type(screen.getByLabelText('Answer (Arabic)'), 'ج')
    await user.type(screen.getByLabelText('Answer (English)'), 'A')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/faqs')).toHaveLength(1))
    expect(server.calls('POST', '/faqs')[0].body).toMatchObject({ question_ar: 'سؤال', question_en: 'Q?' })
  })

  it('shows the server validation errors on the matching fields and stays on the page', async () => {
    mockApi({
      'POST /faqs': () =>
        validationError({ question_en: ['The question en field must not be greater than 255 characters.'], answer_ar: ['The answer ar field is required.'] }),
    })
    const { user } = renderWithProviders(<FaqCreate />, { route: '/faqs/new' })

    await fillAll(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('The question en field must not be greater than 255 characters.')).toBeInTheDocument()
    expect(screen.getByText('The answer ar field is required.')).toBeInTheDocument()
    expect(screen.getByLabelText('Question (English)')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Question (English)')).toHaveFocus() // first invalid field
    expect(screen.getByTestId('location')).toHaveTextContent('/faqs/new')
    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument() // toast
    // the user can correct and retry
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('disables Save while the request is running', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    mockApi({
      'POST /faqs': async () => {
        await gate
        return reply(201, { data: { id: 1 } })
      },
    })
    const { user } = renderWithProviders(<FaqCreate />, { route: '/faqs/new' })
    await fillAll(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
    release()
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/faqs$/))
  })

  it('shows a toast when the server is down (and keeps the form)', async () => {
    mockApi({ 'POST /faqs': () => reply(500, { message: 'boom' }) })
    const { user } = renderWithProviders(<FaqCreate />, { route: '/faqs/new' })
    await fillAll(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    expect(screen.getByLabelText('Question (English)')).toHaveValue('A question?')
  })

  it('validation messages follow the UI language', async () => {
    const { user } = renderWithProviders(<FaqCreate />, { route: '/faqs/new', lang: 'ar' })
    await user.click(screen.getByRole('button', { name: 'حفظ' }))
    expect((await screen.findAllByText('هذا الحقل مطلوب')).length).toBe(4)
  })
})

describe('FaqEdit', () => {
  const route = '/faqs/7'
  const path = '/faqs/:id'

  it('loads the record into the form and keeps Save disabled until something changes', async () => {
    mockApi({ 'GET /faqs/:id': () => ({ data: faq }) })
    const { user } = renderWithProviders(<FaqEdit />, { route, path })

    expect(await screen.findByLabelText('Question (English)')).toHaveValue('How long does it take?')
    expect(screen.getByLabelText('Question (Arabic)')).toHaveValue('ما هي مدة التنفيذ؟')
    expect(screen.getByRole('heading', { level: 1, name: 'Edit question' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    await user.type(screen.getByLabelText('Question (English)'), '!')

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('shows a spinner while loading', () => {
    mockApi({ 'GET /faqs/:id': () => ({ data: faq }) })
    renderWithProviders(<FaqEdit />, { route, path })
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('saves the values with PUT and goes back to the list', async () => {
    const server = mockApi({
      'GET /faqs/:id': () => ({ data: faq }),
      'PUT /faqs/:id': ({ params, body }) => ({ data: { ...faq, ...body, id: Number(params.id) } }),
    })
    const { user } = renderWithProviders(<FaqEdit />, { route, path })
    const english = await screen.findByLabelText('Question (English)')

    await user.clear(english)
    await user.type(english, 'How long?')
    await user.click(screen.getByRole('switch', { name: /Active/ }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/faqs$/))
    expect(server.calls('PUT', '/faqs/7')[0].body).toEqual({
      question_ar: faq.question_ar,
      question_en: 'How long?',
      answer_ar: faq.answer_ar,
      answer_en: faq.answer_en,
      is_active: false,
    })
  })

  it('shows server errors on an edit too', async () => {
    mockApi({ 'GET /faqs/:id': () => ({ data: faq }), 'PUT /faqs/:id': () => validationError({ answer_en: ['Answer is too long.'] }) })
    const { user } = renderWithProviders(<FaqEdit />, { route, path })
    await user.type(await screen.findByLabelText('Answer (English)'), ' more')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Answer is too long.')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/faqs/7')
  })

  it('shows "not found" for a missing question', async () => {
    mockApi({ 'GET /faqs/:id': () => reply(404, { message: 'No query results for model [App\\Models\\Faq] 7' }) })
    renderWithProviders(<FaqEdit />, { route, path })

    expect(await screen.findByText('Question not found')).toBeInTheDocument()
    expect(screen.queryByText(/App\\Models/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faqs')
  })

  it('offers a retry when loading fails for another reason', async () => {
    const server = mockApi({ 'GET /faqs/:id': () => reply(500, { message: 'boom' }) })
    const { user } = renderWithProviders(<FaqEdit />, { route, path })

    expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()

    server.on('GET /faqs/:id', () => ({ data: faq }))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByLabelText('Question (English)')).toBeInTheDocument()
  })
})
