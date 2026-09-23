import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, paginated, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import TeamCreate from './TeamCreate'
import TeamEdit from './TeamEdit'

const emptyLists = { skills_ar: [], skills_en: [], education_ar: [], education_en: [], experience_ar: [], experience_en: [], certifications_ar: [], certifications_en: [], languages_ar: [], languages_en: [] }

const profile = {
  id: 7,
  slug: 'sara-ahmad',
  name_ar: 'سارة أحمد', name_en: 'Sara Ahmad',
  job_title_ar: 'مهندسة برمجيات', job_title_en: 'Software Engineer',
  bio_ar: 'نبذة', bio_en: 'A short bio',
  avatar: null, avatar_url: null,
  email: 'sara@ngptechworld.com', phone: null,
  location_ar: null, location_en: null,
  department_ar: null, department_en: null,
  years_experience: 5,
  linkedin_url: null, github_url: null, website_url: null, twitter_url: null,
  is_active: true,
  ...emptyLists,
  skills_en: ['React'],
}

const fillRequired = async (user) => {
  await user.type(screen.getByLabelText('Name (Arabic)'), 'سارة')
  await user.type(screen.getByLabelText('Name (English)'), 'Sara')
  await user.type(screen.getByLabelText('Job title (Arabic)'), 'مهندسة')
  await user.type(screen.getByLabelText('Job title (English)'), 'Engineer')
  await user.type(screen.getByLabelText('Bio (Arabic)'), 'نبذة قصيرة')
  await user.type(screen.getByLabelText('Bio (English)'), 'A short bio')
}

describe('TeamCreate', () => {
  it('renders every section and the required fields', () => {
    renderWithProviders(<TeamCreate />, { route: '/team/new' })

    expect(screen.getByRole('heading', { level: 1, name: 'Add a team member' })).toBeInTheDocument()
    expect(screen.getByText('Personal information')).toBeInTheDocument()
    expect(screen.getByText('Work information')).toBeInTheDocument()
    expect(screen.getByText('CV')).toBeInTheDocument()
    expect(screen.getByText('Links')).toBeInTheDocument()
    expect(screen.getByLabelText('Name (Arabic)')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByLabelText('Name (English)')).toHaveAttribute('dir', 'ltr')
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/team')
  })

  it('shows an example in every field as a placeholder, in the matching language', () => {
    renderWithProviders(<TeamCreate />, { route: '/team/new' })

    expect(screen.getByLabelText('Name (Arabic)')).toHaveAttribute('placeholder', 'سارة أحمد')
    expect(screen.getByLabelText('Name (English)')).toHaveAttribute('placeholder', 'Sara Ahmad')
    expect(screen.getByLabelText('Email')).toHaveAttribute('placeholder', 'sara@ngptechworld.com')
    expect(screen.getByLabelText('Phone')).toHaveAttribute('placeholder', '+963 933 000 111')
    expect(screen.getByLabelText('Skills (Arabic)')).toHaveAttribute('placeholder', 'React')
    expect(screen.getByLabelText('Education (English)')).toHaveAttribute('placeholder', 'BSc in Software Engineering — Damascus University, 2018')
  })

  it('validates the required fields locally and sends nothing', async () => {
    const server = mockApi({}) // the form also lists dashboard accounts (for linking); that GET is expected
    const { user } = renderWithProviders(<TeamCreate />, { route: '/team/new' })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findAllByText('This field is required')).toHaveLength(6) // name/job_title/bio × ar+en
    expect(server.calls('POST', '/team')).toHaveLength(0)
  })

  it('creates a member with the minimum fields, sending null for everything left blank', async () => {
    const server = mockApi({ 'POST /team': ({ body }) => reply(201, { data: { id: 9, ...body } }) })
    const { user } = renderWithProviders(<TeamCreate />, { route: '/team/new' })

    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/team$/))
    const body = server.calls('POST', '/team')[0].body
    expect(body).toMatchObject({ name_ar: 'سارة', name_en: 'Sara', job_title_en: 'Engineer', is_active: true, slug: null, email: null, years_experience: null })
    expect(body.skills_ar).toEqual([])
    expect(body.skills_en).toEqual([])
  })

  it('adds a skill tag and sends it in the payload', async () => {
    const server = mockApi({ 'POST /team': ({ body }) => reply(201, { data: { id: 9, ...body } }) })
    const { user } = renderWithProviders(<TeamCreate />, { route: '/team/new' })

    await fillRequired(user)
    await user.type(screen.getByLabelText('Skills (English)'), 'React{Enter}')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/team')).toHaveLength(1))
    expect(server.calls('POST', '/team')[0].body.skills_en).toEqual(['React'])
  })

  it('shows the server validation error on the matching field (e.g. a taken slug) and stays on the page', async () => {
    mockApi({ 'POST /team': () => validationError({ slug: ['The slug has already been taken.'] }) })
    const { user } = renderWithProviders(<TeamCreate />, { route: '/team/new' })
    await fillRequired(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('The slug has already been taken.')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/team/new')
  })
})

describe('TeamEdit', () => {
  const route = '/team/7'
  const path = '/team/:id'

  it("embeds the member's portfolio below the profile form", async () => {
    mockApi({ 'GET /team/:id': () => ({ data: profile }), 'GET /team/:id/portfolio': () => paginated([]) })
    renderWithProviders(<TeamEdit />, { route, path })

    expect(await screen.findByLabelText('Name (English)')).toHaveValue('Sara Ahmad')
    expect(screen.getByRole('heading', { name: 'Portfolio' })).toBeInTheDocument()
    expect(await screen.findByText('No portfolio items yet')).toBeInTheDocument()
  })

  it('loads the record into the form and keeps Save disabled until something changes', async () => {
    mockApi({ 'GET /team/:id': () => ({ data: profile }), 'GET /team/:id/portfolio': () => paginated([]) })
    const { user } = renderWithProviders(<TeamEdit />, { route, path })

    expect(await screen.findByLabelText('Name (English)')).toHaveValue('Sara Ahmad')
    expect(screen.getByLabelText('Job title (Arabic)')).toHaveValue('مهندسة برمجيات')
    expect(screen.getByText('React')).toBeInTheDocument() // skill tag
    expect(screen.getByRole('heading', { level: 1, name: 'Edit team member' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    await user.type(screen.getByLabelText('Name (English)'), '!')

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('saves the changed values with PUT and goes back to the list', async () => {
    const server = mockApi({
      'GET /team/:id': () => ({ data: profile }),
      'PUT /team/:id': ({ params, body }) => ({ data: { ...profile, ...body, id: Number(params.id) } }),
      'GET /team/:id/portfolio': () => paginated([]),
    })
    const { user } = renderWithProviders(<TeamEdit />, { route, path })
    const english = await screen.findByLabelText('Job title (English)')

    await user.clear(english)
    await user.type(english, 'Senior Software Engineer')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/team$/))
    expect(server.calls('PUT', '/team/7')[0].body).toMatchObject({ job_title_en: 'Senior Software Engineer', slug: 'sara-ahmad' })
  })

  it('shows "not found" for a missing member', async () => {
    mockApi({ 'GET /team/:id': () => reply(404, { message: 'No query results for model [App\\Models\\TeamProfile] 7' }) })
    renderWithProviders(<TeamEdit />, { route, path })

    expect(await screen.findByText('Member not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Our Team' })).toHaveAttribute('href', '/team')
  })
})
