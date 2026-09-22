import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import PartnerCreate from './PartnerCreate'
import PartnerEdit from './PartnerEdit'
import { makePartnerSchema } from './schema'
import { displayUrl, isHttpUrl } from './website'

const partner = {
  id: 7,
  name: 'Acme Corp',
  logo: 'partners/acme.png',
  logo_url: 'http://localhost/media/partners/acme.png',
  url: 'https://acme.example',
  is_active: true,
  order: 3,
}

const png = (name = 'logo.png') => new File([new Uint8Array(10)], name, { type: 'image/png' })
const uploaded = { path: 'partners/new-logo.png', url: 'http://localhost/media/partners/new-logo.png' }

// the label of a required <Field> has a decorative asterisk, so query by role (the accessible name skips it)
const nameBox = () => screen.getByRole('textbox', { name: 'Name' })
const websiteBox = () => screen.getByRole('textbox', { name: 'Website' })

describe('PartnerCreate', () => {
  it('renders name, website (left-to-right), the logo box, the active switch and Save / Cancel', () => {
    renderWithProviders(<PartnerCreate />, { route: '/partners/new' })

    expect(screen.getByRole('heading', { level: 1, name: 'Add a partner' })).toBeInTheDocument()
    expect(nameBox()).toBeInTheDocument()
    expect(websiteBox()).toHaveAttribute('dir', 'ltr')
    expect(websiteBox()).toHaveAttribute('type', 'url')
    expect(screen.getByRole('button', { name: 'Logo' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /Active/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/partners')
    expect(screen.getByRole('link', { name: 'Partners' })).toHaveAttribute('href', '/partners') // back link
  })

  it('validates the required name locally and sends nothing', async () => {
    const server = mockApi({})
    const { user } = renderWithProviders(<PartnerCreate />, { route: '/partners/new' })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('This field is required')).toBeInTheDocument()
    expect(nameBox()).toHaveAttribute('aria-invalid', 'true')
    expect(nameBox()).toHaveFocus()
    expect(server.requests).toHaveLength(0)
  })

  it.each(['acme.example', 'ftp://acme.example', 'javascript:alert(1)', '//acme.example', 'not a url'])('rejects the website "%s" locally (http/https only)', async (bad) => {
    const server = mockApi({})
    const { user } = renderWithProviders(<PartnerCreate />, { route: '/partners/new' })
    await user.type(nameBox(), 'Acme')

    await user.type(websiteBox(), bad)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter a valid URL (starting with http:// or https://)')).toBeInTheDocument()
    expect(websiteBox()).toHaveAttribute('aria-invalid', 'true')
    expect(server.requests).toHaveLength(0)
  })

  it('creates the partner with the defaults (no website, no logo, active) and returns to the list', async () => {
    const server = mockApi({ 'POST /partners': ({ body }) => reply(201, { data: { id: 9, ...body } }) })
    const { user } = renderWithProviders(<PartnerCreate />, { route: '/partners/new' })

    await user.type(nameBox(), 'Globex')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/partners$/))
    expect(server.calls('POST', '/partners')[0].body).toEqual({ name: 'Globex', url: null, logo: null, is_active: true })
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('sends the trimmed website and the inactive flag', async () => {
    const server = mockApi({ 'POST /partners': ({ body }) => reply(201, { data: body }) })
    const { user } = renderWithProviders(<PartnerCreate />, { route: '/partners/new' })

    await user.type(nameBox(), '  Globex  ')
    await user.type(websiteBox(), '  https://globex.example/en?ref=ngp  ')
    await user.click(screen.getByRole('switch', { name: /Active/ })) // off
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/partners')).toHaveLength(1))
    expect(server.calls('POST', '/partners')[0].body).toEqual({ name: 'Globex', url: 'https://globex.example/en?ref=ngp', logo: null, is_active: false })
  })

  it('treats a website that is only whitespace as empty (null)', async () => {
    const server = mockApi({ 'POST /partners': ({ body }) => reply(201, { data: body }) })
    const { user } = renderWithProviders(<PartnerCreate />, { route: '/partners/new' })

    await user.type(nameBox(), 'Globex')
    await user.type(websiteBox(), '   ')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/partners')).toHaveLength(1))
    expect(server.calls('POST', '/partners')[0].body.url).toBeNull()
  })

  it('uploads the logo to the partners folder and sends its relative path (not the URL)', async () => {
    const server = mockApi({
      'POST /uploads': () => reply(201, { data: uploaded }),
      'POST /partners': ({ body }) => reply(201, { data: body }),
    })
    const { user } = renderWithProviders(<PartnerCreate />, { route: '/partners/new' })
    await user.type(nameBox(), 'Globex')

    await user.upload(screen.getByTestId('image-input'), png())

    expect(await screen.findByRole('img', { name: 'Logo' })).toHaveAttribute('src', uploaded.url)
    expect(server.calls('POST', '/uploads')[0].body.get('folder')).toBe('partners')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/partners')).toHaveLength(1))
    expect(server.calls('POST', '/partners')[0].body.logo).toBe('partners/new-logo.png')
  })

  it('disables Save while the logo uploads and enables it again afterwards', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    const server = mockApi({
      'POST /uploads': async () => {
        await gate
        return reply(201, { data: uploaded })
      },
      'POST /partners': ({ body }) => reply(201, { data: body }),
    })
    const { user } = renderWithProviders(<PartnerCreate />, { route: '/partners/new' })
    await user.type(nameBox(), 'Globex')

    await user.upload(screen.getByTestId('image-input'), png())

    expect(await screen.findByText('Uploading…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(server.calls('POST', '/partners')).toHaveLength(0)

    release()
    await screen.findByRole('img', { name: 'Logo' })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
  })

  it('shows a rejected upload under the logo box and keeps the form usable', async () => {
    mockApi({ 'POST /uploads': () => validationError({ file: ['The file must be an image.'] }) })
    const { user } = renderWithProviders(<PartnerCreate />, { route: '/partners/new' })

    await user.upload(screen.getByTestId('image-input'), png())

    expect(await screen.findByText('The file must be an image.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('shows the server validation errors on the matching fields (name, website, logo) and stays on the page', async () => {
    mockApi({
      'POST /partners': () =>
        validationError({
          name: ['The name field must not be greater than 255 characters.'],
          url: ['The url field must be a valid URL.'],
          logo: ['The logo field format is invalid.'],
        }),
    })
    const { user } = renderWithProviders(<PartnerCreate />, { route: '/partners/new' })
    await user.type(nameBox(), 'Globex')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('The name field must not be greater than 255 characters.')).toBeInTheDocument()
    expect(screen.getByText('The url field must be a valid URL.')).toBeInTheDocument()
    expect(screen.getByText('The logo field format is invalid.')).toBeInTheDocument()
    expect(websiteBox()).toHaveAttribute('aria-invalid', 'true')
    expect(nameBox()).toHaveFocus() // first invalid field
    expect(screen.getByTestId('location')).toHaveTextContent('/partners/new')
    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument() // toast
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('disables Save while the request is running', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    mockApi({
      'POST /partners': async () => {
        await gate
        return reply(201, { data: { id: 1 } })
      },
    })
    const { user } = renderWithProviders(<PartnerCreate />, { route: '/partners/new' })
    await user.type(nameBox(), 'Globex')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
    release()
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/partners$/))
  })

  it('shows a toast when the server is down (and keeps the form)', async () => {
    mockApi({ 'POST /partners': () => reply(500, { message: 'boom' }) })
    const { user } = renderWithProviders(<PartnerCreate />, { route: '/partners/new' })
    await user.type(nameBox(), 'Globex')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Server error. Please try again later.')).toBeInTheDocument()
    expect(nameBox()).toHaveValue('Globex')
  })

  it('renders in Arabic with Arabic validation messages', async () => {
    const { user } = renderWithProviders(<PartnerCreate />, { route: '/partners/new', lang: 'ar' })

    expect(screen.getByRole('heading', { level: 1, name: 'إضافة شريك' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'حفظ' }))
    expect(await screen.findByText('هذا الحقل مطلوب')).toBeInTheDocument()
  })
})

describe('partner schema and helpers', () => {
  const c = { required: 'required', maxLength: (n) => `max ${n}`, invalidUrl: 'bad url' }
  const valid = { name: 'N', url: '', logo: null, is_active: true }

  it('mirrors the API limits: name required ≤ 255, optional http(s) website ≤ 255', () => {
    const schema = makePartnerSchema(c)
    expect(schema.safeParse(valid).success).toBe(true)
    expect(schema.safeParse({ ...valid, url: 'https://acme.example' }).success).toBe(true)
    expect(schema.safeParse({ ...valid, url: 'http://acme.example' }).success).toBe(true)
    expect(schema.safeParse({ ...valid, url: 'https://acme.example/' + 'u'.repeat(234) }).success).toBe(true) // 255 characters in all
    expect(schema.safeParse({ ...valid, url: 'https://acme.example/' + 'u'.repeat(235) }).success).toBe(false) // 256
    expect(schema.safeParse({ ...valid, url: 'ftp://acme.example' }).success).toBe(false)
    expect(schema.safeParse({ ...valid, name: 'x'.repeat(256) }).success).toBe(false)
    expect(schema.safeParse({ ...valid, name: '  ' }).success).toBe(false)
  })

  it('isHttpUrl accepts only http(s) addresses and displayUrl strips the scheme and trailing slash', () => {
    expect(isHttpUrl('https://a.example')).toBe(true)
    expect(isHttpUrl('HTTP://a.example/x')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('a.example')).toBe(false)
    expect(isHttpUrl(null)).toBe(false)
    expect(displayUrl('https://www.a.example/about/')).toBe('www.a.example/about')
    expect(displayUrl('http://a.example')).toBe('a.example')
    expect(displayUrl(null)).toBe('')
  })
})

describe('PartnerEdit', () => {
  const route = '/partners/7'
  const path = '/partners/:id'

  it('loads the record (with its logo and switch) and keeps Save disabled until something changes', async () => {
    mockApi({ 'GET /partners/:id': () => ({ data: partner }) })
    const { user } = renderWithProviders(<PartnerEdit />, { route, path })

    expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveValue('Acme Corp')
    expect(websiteBox()).toHaveValue('https://acme.example')
    expect(screen.getByRole('switch', { name: /Active/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('img', { name: 'Logo' })).toHaveAttribute('src', partner.logo_url)
    expect(screen.getByRole('heading', { level: 1, name: 'Edit partner' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    await user.type(nameBox(), '!')

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('shows a spinner while loading', () => {
    mockApi({ 'GET /partners/:id': () => ({ data: partner }) })
    renderWithProviders(<PartnerEdit />, { route, path })
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('saves the changes with PUT (unchanged logo path included) and goes back to the list', async () => {
    const server = mockApi({
      'GET /partners/:id': () => ({ data: partner }),
      'PUT /partners/:id': ({ params, body }) => ({ data: { ...partner, ...body, id: Number(params.id) } }),
    })
    const { user } = renderWithProviders(<PartnerEdit />, { route, path })
    const name = await screen.findByRole('textbox', { name: 'Name' })

    await user.clear(name)
    await user.type(name, 'Acme Inc')
    await user.click(screen.getByRole('switch', { name: /Active/ }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/partners$/))
    expect(server.calls('PUT', '/partners/7')[0].body).toEqual({ name: 'Acme Inc', url: 'https://acme.example', logo: 'partners/acme.png', is_active: false })
  })

  it('clearing the website sends null', async () => {
    const server = mockApi({ 'GET /partners/:id': () => ({ data: partner }), 'PUT /partners/:id': ({ body }) => ({ data: { ...partner, ...body } }) })
    const { user } = renderWithProviders(<PartnerEdit />, { route, path })
    await screen.findByRole('textbox', { name: 'Name' })

    await user.clear(websiteBox())
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('PUT', '/partners/7')).toHaveLength(1))
    expect(server.calls('PUT', '/partners/7')[0].body.url).toBeNull()
  })

  it('removing the logo sends logo: null', async () => {
    const server = mockApi({ 'GET /partners/:id': () => ({ data: partner }), 'PUT /partners/:id': ({ body }) => ({ data: { ...partner, ...body } }) })
    const { user } = renderWithProviders(<PartnerEdit />, { route, path })
    await screen.findByRole('img', { name: 'Logo' })

    await user.click(screen.getByRole('button', { name: 'Remove image' }))
    expect(screen.queryByRole('img', { name: 'Logo' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('PUT', '/partners/7')).toHaveLength(1))
    expect(server.calls('PUT', '/partners/7')[0].body.logo).toBeNull()
  })

  it('replacing the logo sends the new relative path', async () => {
    const server = mockApi({
      'GET /partners/:id': () => ({ data: partner }),
      'POST /uploads': () => reply(201, { data: uploaded }),
      'PUT /partners/:id': ({ body }) => ({ data: { ...partner, ...body } }),
    })
    const { user } = renderWithProviders(<PartnerEdit />, { route, path })
    await screen.findByRole('img', { name: 'Logo' })

    await user.upload(screen.getByTestId('image-input'), png('other.png'))
    await waitFor(() => expect(screen.getByRole('img', { name: 'Logo' })).toHaveAttribute('src', uploaded.url))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('PUT', '/partners/7')).toHaveLength(1))
    expect(server.calls('PUT', '/partners/7')[0].body.logo).toBe('partners/new-logo.png')
  })

  it('shows server errors on an edit too', async () => {
    mockApi({ 'GET /partners/:id': () => ({ data: partner }), 'PUT /partners/:id': () => validationError({ url: ['The url field must be a valid URL.'] }) })
    const { user } = renderWithProviders(<PartnerEdit />, { route, path })
    await user.type(await screen.findByRole('textbox', { name: 'Website' }), '/x')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('The url field must be a valid URL.')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/partners/7')
  })

  it('shows "not found" for a missing partner', async () => {
    mockApi({ 'GET /partners/:id': () => reply(404, { message: 'No query results for model [App\\Models\\Partner] 7' }) })
    renderWithProviders(<PartnerEdit />, { route, path })

    expect(await screen.findByText('Partner not found')).toBeInTheDocument()
    expect(screen.queryByText(/App\\Models/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Partners' })).toHaveAttribute('href', '/partners')
  })

  it('offers a retry when loading fails for another reason', async () => {
    const server = mockApi({ 'GET /partners/:id': () => reply(500, { message: 'boom' }) })
    const { user } = renderWithProviders(<PartnerEdit />, { route, path })

    expect(await screen.findByText('Could not load the data.')).toBeInTheDocument()

    server.on('GET /partners/:id', () => ({ data: partner }))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('textbox', { name: 'Name' })).toBeInTheDocument()
  })

  it('tolerates a record without website or logo', async () => {
    mockApi({ 'GET /partners/:id': () => ({ data: { ...partner, url: null, logo: null, logo_url: null } }) })
    renderWithProviders(<PartnerEdit />, { route, path })

    expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveValue('Acme Corp')
    expect(websiteBox()).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Logo' })).toBeInTheDocument()
  })
})
