import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi, paginated, reply } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import BookCreate from './BookCreate'
import BookEdit from './BookEdit'
import BookList from './BookList'
import feature from './index'

const book = {
  id: 4, slug: 'clean-code',
  title_ar: 'الكود النظيف', title_en: 'Clean Code',
  author_ar: 'روبرت مارتن', author_en: 'Robert Martin',
  description_ar: 'وصف', description_en: 'Description',
  category_ar: null, category_en: null, language_ar: null, language_en: null,
  pages: 464, year: 2008,
  cover_image: null, cover_image_url: null,
  file_path: 'books/files/abc.pdf', file_url: 'https://api.test/media/books/files/abc.pdf', file_size: 3_500_000,
  allow_download: true, reads_count: 120, downloads_count: 45,
  is_active: true, order: 1, created_at: '2026-09-30T10:00:00Z', updated_at: '2026-09-30T10:00:00Z',
}

describe('library feature contract', () => {
  it('is its own section in the content group', () => {
    expect(feature.id).toBe('library')
    expect(feature.nav).toMatchObject({ group: 'content', to: '/library', label: { ar: 'المكتبة', en: 'Library' } })
    expect(feature.routes.map((r) => r.path)).toEqual(['library', 'library/new', 'library/:id'])
  })
})

describe('BookList', () => {
  it('lists the books with their readers and downloads', async () => {
    mockApi({ 'GET /books': () => paginated([book]) })
    renderWithProviders(<BookList />, { route: '/library' })

    const row = (await screen.findByText('Clean Code')).closest('tr')
    expect(within(row).getByText('Robert Martin')).toBeInTheDocument()
    expect(within(row).getByText('120')).toBeInTheDocument()
    expect(within(row).getByText('45')).toBeInTheDocument()
  })
})

describe('BookCreate', () => {
  it('needs the titles, the descriptions and the PDF', async () => {
    const server = mockApi({})
    const { user } = renderWithProviders(<BookCreate />, { route: '/library/new' })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findAllByText('This field is required')).toHaveLength(5) // title × 2, description × 2, file
    expect(server.requests).toHaveLength(0)
  })

  it('uploads the PDF to the books folder and creates the book', async () => {
    const server = mockApi({
      'POST /uploads': () => reply(201, { data: { path: 'books/files/new.pdf', url: 'https://api.test/media/books/files/new.pdf', size: 2048 } }),
      'POST /books': ({ body }) => reply(201, { data: { id: 9, ...body } }),
    })
    const { user } = renderWithProviders(<BookCreate />, { route: '/library/new' })

    await user.type(screen.getByLabelText('Title (Arabic)'), 'كتاب')
    await user.type(screen.getByLabelText('Title (English)'), 'A book')
    await user.type(screen.getByLabelText('Description (Arabic)'), 'وصف')
    await user.type(screen.getByLabelText('Description (English)'), 'About it')
    await user.type(screen.getByLabelText('Pages'), '120')
    fireEvent.change(screen.getByTestId('pdf-input'), { target: { files: [new File(['%PDF-1.4'], 'my book.pdf', { type: 'application/pdf' })] } })
    expect(await screen.findByText('my book.pdf')).toBeInTheDocument()
    expect(server.calls('POST', '/uploads')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('POST', '/books')).toHaveLength(1))
    expect(server.calls('POST', '/books')[0].body).toMatchObject({
      title_en: 'A book', file_path: 'books/files/new.pdf', pages: 120, year: null, author_en: null, allow_download: true, slug: null,
    })
  })

  it('refuses a file that is not a PDF before uploading it', async () => {
    const server = mockApi({})
    renderWithProviders(<BookCreate />, { route: '/library/new' })

    fireEvent.change(screen.getByTestId('pdf-input'), { target: { files: [new File(['x'], 'notes.docx', { type: 'application/msword' })] } })

    expect(await screen.findByText('The file must be a PDF.')).toBeInTheDocument()
    expect(server.requests).toHaveLength(0)
  })
})

describe('BookEdit', () => {
  it('shows the saved PDF and can switch downloading off', async () => {
    const server = mockApi({
      'GET /books/:id': () => ({ data: book }),
      'PUT /books/:id': ({ body }) => ({ data: { ...book, ...body } }),
    })
    const { user } = renderWithProviders(<BookEdit />, { route: '/library/4', path: '/library/:id' })

    expect(await screen.findByLabelText('Title (English)')).toHaveValue('Clean Code')
    expect(screen.getByText('Current book file')).toBeInTheDocument()
    expect(screen.getByText('3.3 MB')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', book.file_url)

    await user.click(screen.getByRole('switch', { name: /Allow downloading/ }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(server.calls('PUT', '/books/4')).toHaveLength(1))
    expect(server.calls('PUT', '/books/4')[0].body).toMatchObject({ allow_download: false, file_path: 'books/files/abc.pdf' })
  })
})
