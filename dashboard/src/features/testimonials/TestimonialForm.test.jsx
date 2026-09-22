import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import TestimonialCreate from './TestimonialCreate'
import TestimonialEdit from './TestimonialEdit'
import { makeTestimonialSchema } from './schema'

const testimonial = {
  id: 7,
  name: 'Sara Ali',
  company: 'Acme Corp',
  quote_ar: 'خدمة ممتازة',
  quote_en: 'Excellent service',
  rating: 4,
  avatar: 'testimonials/sara.png',
  avatar_url: 'http://localhost/media/testimonials/sara.png',
  is_active: true,
  order: 3,
}

const png = (name = 'face.png') => new File([new Uint8Array(10)], name, { type: 'image/png' })
const uploaded = { path: 'testimonials/new-face.png', url: 'http://localhost/media/testimonials/new-face.png' }

// the label of a required <Field> has a decorative asterisk, so query by role (the accessible name skips it)
const nameBox = () => screen.getByRole('textbox', { name: 'Name' })
const companyBox = () => screen.getByRole('textbox', { name: 'Company' })
const ratingOf = () => screen.getAllByRole('radio').find((radio) => radio.getAttribute('aria-checked') === 'true')

const fillRequired = async (user) => {
  await user.type(nameBox(), 'Omar Khaled')
  await user.type(screen.getByLabelText('Quote (Arabic)'), 'ممتاز')
  await user.type(screen.getByLabelText('Quote (English)'), 'Great work')
}

describe('TestimonialCreate', () => {
  it('renders the photo box, name, company, the quote pair, a 5-star default, the active switch and Save / Cancel', () => {
    renderWithProviders(<TestimonialCreate />, { route: '/testimonials/new' })

    expect(screen.getByRole('heading', { level: 1, name: 'Add a testimonial' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Photo' })).toBeInTheDocument()
    expect(nameBox()).toBeInTheDocument()
    expect(companyBox()).toBeInTheDocument()
    expect(screen.getByLabelText('Quote (Arabic)')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByLabelText('Quote (English)').tagName).toBe('TEXTAREA')
    expect(screen.getByRole('radiogroup', { name: 'Rating' })).toBeInTheDocument()
    expect(ratingOf()).toHaveAccessibleName('5 stars')
    expect(screen.getByRole('switch', { name: /Active/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/testimonials')
    expect(screen.getByRole('link', { name: 'Testimonials' })).toHaveAttribute('href', '/testimonials') // back link
  })

  it('validates the required fields locally and sends nothing', async () => {
    const server = mockApi({})
    const { user } = renderWithProviders(<TestimonialCreate />, { route: '/testimonials/new' })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findAllByText('This field is required')).toHaveLength(3) // name + both quotes (company is optional)
    expect(nameBox()).toHaveAttribute('aria-invalid', 'true')
    expect(nameBox()).toHaveFocus()
    expect(server.requests).toHaveLength(0)
  })

  it('creates the testimonial with the defaults (rating 5, active, no company, no avatar) and returns to the list', async () => {
    const server = mockApi({ 'POST /testimonials': ({ body }) => reply(201, { data: { id: 9, ...body } }) })
    const { user } = renderWithProviders(<TestimonialCreate />, { route: '/testimonials/new' })

    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/testimonials$/))
    expect(server.calls('POST', '/testimonials')[0].body).toEqual({
      name: 'Omar Khaled',
      company: null,
      quote_ar: 'ممتاز',
      quote_en: 'Great work',
      rating: 5,
      avatar: null,
      is_active: true,
    })
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('sends the chosen rating, the company and the inactive flag (rating set with the mouse and the keyboard)', async () => {
    const server = mockApi({ 'POST /testimonials': ({ body }) => reply(201, { data: body }) })
    const { user } = renderWithProviders(<TestimonialCreate />, { route: '/testimonials/new' })

    await fillRequired(user)
    await user.type(companyBox(), 'Globex')
    await user.click(screen.getByRole('radio', { name: '2 stars' }))
    await user.keyboard('{ArrowRight}') // 3 stars
    await user.click(screen.getByRole('switch', { name: /Active/ })) // off
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/testimonials')).toHaveLength(1))
    expect(server.calls('POST', '/testimonials')[0].body).toMatchObject({ company: 'Globex', rating: 3, is_active: false })
  })

  it('trims whitespace and turns a blank company into null', async () => {
    const server = mockApi({ 'POST /testimonials': ({ body }) => reply(201, { data: body }) })
    const { user } = renderWithProviders(<TestimonialCreate />, { route: '/testimonials/new' })

    await user.type(nameBox(), '  Omar  ')
    await user.type(companyBox(), '   ')
    await user.type(screen.getByLabelText('Quote (Arabic)'), '  ع  ')
    await user.type(screen.getByLabelText('Quote (English)'), '  Q  ')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/testimonials')).toHaveLength(1))
    expect(server.calls('POST', '/testimonials')[0].body).toMatchObject({ name: 'Omar', company: null, quote_ar: 'ع', quote_en: 'Q' })
  })

  it('uploads the photo to the testimonials folder and sends its relative path (not the URL)', async () => {
    const server = mockApi({
      'POST /uploads': () => reply(201, { data: uploaded }),
      'POST /testimonials': ({ body }) => reply(201, { data: body }),
    })
    const { user } = renderWithProviders(<TestimonialCreate />, { route: '/testimonials/new' })
    await fillRequired(user)

    await user.upload(screen.getByTestId('image-input'), png())

    expect(await screen.findByRole('img', { name: 'Photo' })).toHaveAttribute('src', uploaded.url)
    expect(server.calls('POST', '/uploads')[0].body.get('folder')).toBe('testimonials')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/testimonials')).toHaveLength(1))
    expect(server.calls('POST', '/testimonials')[0].body.avatar).toBe('testimonials/new-face.png')
  })

  it('disables Save while the photo uploads and enables it again afterwards', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    const server = mockApi({
      'POST /uploads': async () => {
        await gate
        return reply(201, { data: uploaded })
      },
      'POST /testimonials': ({ body }) => reply(201, { data: body }),
    })
    const { user } = renderWithProviders(<TestimonialCreate />, { route: '/testimonials/new' })
    await fillRequired(user)

    await user.upload(screen.getByTestId('image-input'), png())

    expect(await screen.findByText('Uploading…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(server.calls('POST', '/testimonials')).toHaveLength(0)

    release()
    await screen.findByRole('img', { name: 'Photo' })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
  })

  it('shows the server validation errors on the matching fields (name, quote, avatar, rating)', async () => {
    mockApi({
      'POST /testimonials': () =>
        validationError({
          name: ['The name field must not be greater than 255 characters.'],
          quote_en: ['The quote en field is required.'],
          avatar: ['The avatar field format is invalid.'],
          rating: ['The rating field must be between 1 and 5.'],
        }),
    })
    const { user } = renderWithProviders(<TestimonialCreate />, { route: '/testimonials/new' })
    await fillRequired(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('The name field must not be greater than 255 characters.')).toBeInTheDocument()
    expect(screen.getByText('The quote en field is required.')).toBeInTheDocument()
    expect(screen.getByText('The avatar field format is invalid.')).toBeInTheDocument()
    expect(screen.getByText('The rating field must be between 1 and 5.')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Rating' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Quote (English)')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByTestId('location')).toHaveTextContent('/testimonials/new')
    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument() // toast
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('disables Save while the request is running', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    mockApi({
      'POST /testimonials': async () => {
        await gate
        return reply(201, { data: { id: 1 } })
      },
    })
    const { user } = renderWithProviders(<TestimonialCreate />, { route: '/testimonials/new' })
    await fillRequired(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
    release()
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/testimonials$/))
  })

  it('shows a toast when the server is down (and keeps the form)', async () => {
    mockApi({ 'POST /testimonials': () => reply(500, { message: 'boom' }) })
    const { user } = renderWithProviders(<TestimonialCreate />, { route: '/testimonials/new' })
    await fillRequired(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    expect(nameBox()).toHaveValue('Omar Khaled')
  })

  it('renders in Arabic with Arabic star names and validation messages', async () => {
    const { user } = renderWithProviders(<TestimonialCreate />, { route: '/testimonials/new', lang: 'ar' })

    expect(screen.getByRole('heading', { level: 1, name: 'إضافة رأي عميل' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'نجمتان' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'حفظ' }))
    expect((await screen.findAllByText('هذا الحقل مطلوب')).length).toBe(3)
  })
})

describe('testimonial schema', () => {
  const c = { required: 'required', maxLength: (n) => `max ${n}`, numberRange: (a, b) => `${a}-${b}` }
  const valid = { name: 'N', company: '', quote_ar: 'ع', quote_en: 'Q', rating: 5, avatar: null, is_active: true }

  it('mirrors the API limits and the 1–5 rating', () => {
    const schema = makeTestimonialSchema(c)
    expect(schema.safeParse(valid).success).toBe(true)
    ;[1, 2, 3, 4, 5].forEach((rating) => expect(schema.safeParse({ ...valid, rating }).success).toBe(true))
    ;[0, 6, 2.5, null, '3'].forEach((rating) => expect(schema.safeParse({ ...valid, rating }).success).toBe(false))
    expect(schema.safeParse({ ...valid, name: 'x'.repeat(256) }).success).toBe(false)
    expect(schema.safeParse({ ...valid, company: 'x'.repeat(256) }).success).toBe(false)
    expect(schema.safeParse({ ...valid, quote_en: 'x'.repeat(2000) }).success).toBe(true)
    expect(schema.safeParse({ ...valid, quote_en: 'x'.repeat(2001) }).success).toBe(false)
  })
})

describe('TestimonialEdit', () => {
  const route = '/testimonials/7'
  const path = '/testimonials/:id'

  it('loads the record (with its photo, rating and switch) and keeps Save disabled until something changes', async () => {
    mockApi({ 'GET /testimonials/:id': () => ({ data: testimonial }) })
    const { user } = renderWithProviders(<TestimonialEdit />, { route, path })

    expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveValue('Sara Ali')
    expect(companyBox()).toHaveValue('Acme Corp')
    expect(screen.getByLabelText('Quote (Arabic)')).toHaveValue('خدمة ممتازة')
    expect(screen.getByLabelText('Quote (English)')).toHaveValue('Excellent service')
    expect(ratingOf()).toHaveAccessibleName('4 stars')
    expect(screen.getByRole('switch', { name: /Active/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('img', { name: 'Photo' })).toHaveAttribute('src', testimonial.avatar_url)
    expect(screen.getByRole('heading', { level: 1, name: 'Edit testimonial' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    await user.type(nameBox(), '!')

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('shows a spinner while loading', () => {
    mockApi({ 'GET /testimonials/:id': () => ({ data: testimonial }) })
    renderWithProviders(<TestimonialEdit />, { route, path })
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('saves the changes with PUT (unchanged photo path included) and goes back to the list', async () => {
    const server = mockApi({
      'GET /testimonials/:id': () => ({ data: testimonial }),
      'PUT /testimonials/:id': ({ params, body }) => ({ data: { ...testimonial, ...body, id: Number(params.id) } }),
    })
    const { user } = renderWithProviders(<TestimonialEdit />, { route, path })
    const name = await screen.findByRole('textbox', { name: 'Name' })

    await user.clear(name)
    await user.type(name, 'Sara A.')
    await user.click(screen.getByRole('radio', { name: '2 stars' }))
    await user.click(screen.getByRole('switch', { name: /Active/ }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/testimonials$/))
    expect(server.calls('PUT', '/testimonials/7')[0].body).toEqual({
      name: 'Sara A.',
      company: 'Acme Corp',
      quote_ar: testimonial.quote_ar,
      quote_en: testimonial.quote_en,
      rating: 2,
      avatar: 'testimonials/sara.png',
      is_active: false,
    })
  })

  it('clearing the company sends null', async () => {
    const server = mockApi({ 'GET /testimonials/:id': () => ({ data: testimonial }), 'PUT /testimonials/:id': ({ body }) => ({ data: { ...testimonial, ...body } }) })
    const { user } = renderWithProviders(<TestimonialEdit />, { route, path })
    await screen.findByRole('textbox', { name: 'Name' })

    await user.clear(companyBox())
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('PUT', '/testimonials/7')).toHaveLength(1))
    expect(server.calls('PUT', '/testimonials/7')[0].body.company).toBeNull()
  })

  it('removing the photo sends avatar: null', async () => {
    const server = mockApi({ 'GET /testimonials/:id': () => ({ data: testimonial }), 'PUT /testimonials/:id': ({ body }) => ({ data: { ...testimonial, ...body } }) })
    const { user } = renderWithProviders(<TestimonialEdit />, { route, path })
    await screen.findByRole('img', { name: 'Photo' })

    await user.click(screen.getByRole('button', { name: 'Remove image' }))
    expect(screen.queryByRole('img', { name: 'Photo' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('PUT', '/testimonials/7')).toHaveLength(1))
    expect(server.calls('PUT', '/testimonials/7')[0].body.avatar).toBeNull()
  })

  it('replacing the photo sends the new relative path', async () => {
    const server = mockApi({
      'GET /testimonials/:id': () => ({ data: testimonial }),
      'POST /uploads': () => reply(201, { data: uploaded }),
      'PUT /testimonials/:id': ({ body }) => ({ data: { ...testimonial, ...body } }),
    })
    const { user } = renderWithProviders(<TestimonialEdit />, { route, path })
    await screen.findByRole('img', { name: 'Photo' })

    await user.upload(screen.getByTestId('image-input'), png('other.png'))
    await waitFor(() => expect(screen.getByRole('img', { name: 'Photo' })).toHaveAttribute('src', uploaded.url))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('PUT', '/testimonials/7')).toHaveLength(1))
    expect(server.calls('PUT', '/testimonials/7')[0].body.avatar).toBe('testimonials/new-face.png')
  })

  it('shows server errors on an edit too', async () => {
    mockApi({ 'GET /testimonials/:id': () => ({ data: testimonial }), 'PUT /testimonials/:id': () => validationError({ quote_ar: ['Quote is too long.'] }) })
    const { user } = renderWithProviders(<TestimonialEdit />, { route, path })
    await user.type(await screen.findByLabelText('Quote (Arabic)'), ' زيادة')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Quote is too long.')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/testimonials/7')
  })

  it('shows "not found" for a missing testimonial', async () => {
    mockApi({ 'GET /testimonials/:id': () => reply(404, { message: 'No query results for model [App\\Models\\Testimonial] 7' }) })
    renderWithProviders(<TestimonialEdit />, { route, path })

    expect(await screen.findByText('Testimonial not found')).toBeInTheDocument()
    expect(screen.queryByText(/App\\Models/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Testimonials' })).toHaveAttribute('href', '/testimonials')
  })

  it('offers a retry when loading fails for another reason', async () => {
    const server = mockApi({ 'GET /testimonials/:id': () => reply(500, { message: 'boom' }) })
    const { user } = renderWithProviders(<TestimonialEdit />, { route, path })

    expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()

    server.on('GET /testimonials/:id', () => ({ data: testimonial }))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('textbox', { name: 'Name' })).toBeInTheDocument()
  })

  it('tolerates a record without company or photo', async () => {
    mockApi({ 'GET /testimonials/:id': () => ({ data: { ...testimonial, company: null, avatar: null, avatar_url: null } }) })
    renderWithProviders(<TestimonialEdit />, { route, path })

    expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveValue('Sara Ali')
    expect(companyBox()).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Photo' })).toBeInTheDocument()
  })
})
