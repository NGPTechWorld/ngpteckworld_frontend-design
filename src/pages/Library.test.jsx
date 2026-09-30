import { render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from '../i18n/LanguageContext'
import { ui } from '../i18n/ui'
import { api } from '../lib/api'
import { openPdf } from '../lib/pdf'
import Library from './Library'
import BookDetail, { fileSize } from './BookDetail'
import BookReader from './BookReader'

vi.mock('../lib/api', () => ({ api: { getBooks: vi.fn(), getBook: vi.fn(), readBook: vi.fn() } }))
// pdf.js needs a real browser (canvas, workers); the reader is tested against a fake document instead
vi.mock('../lib/pdf', () => ({ openPdf: vi.fn() }))

const t = ui.ar // the site starts in Arabic unless the visitor picked another language

const book = {
  id: 1, slug: 'clean-code',
  title_ar: 'الكود النظيف', title_en: 'Clean Code',
  author_ar: 'روبرت مارتن', author_en: 'Robert Martin',
  category_ar: 'برمجة', category_en: 'Programming',
  cover_image: 'https://api.test/media/books/c.png', reads_count: 25,
  description_ar: 'كتاب عن كتابة كود مقروء', description_en: 'About readable code',
  language_ar: 'العربية', language_en: 'Arabic', pages: 464, year: 2008, file_size: 3_500_000, downloads_count: 7,
  file_url: 'https://api.test/api/books/clean-code/file',
  download_url: 'https://api.test/api/books/clean-code/download',
}

const fakePage = { getViewport: ({ scale }) => ({ width: 600 * scale, height: 800 * scale }), render: () => ({ promise: Promise.resolve(), cancel() {} }) }
const fakeDoc = (numPages) => ({ numPages, getPage: vi.fn().mockResolvedValue(fakePage) })

const renderAt = (path) =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/library" element={<Library />} />
          <Route path="/library/:slug" element={<BookDetail />} />
          <Route path="/library/:slug/read" element={<BookReader />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )

beforeEach(() => {
  localStorage.clear()
  api.getBooks.mockReset().mockResolvedValue([book])
  api.getBook.mockReset().mockResolvedValue(book)
  api.readBook.mockReset().mockResolvedValue({ data: { reads_count: 26 } })
  openPdf.mockReset().mockResolvedValue(fakeDoc(3))
})

test('lists the books as cards with cover, title, author and readers', async () => {
  renderAt('/library')

  const card = (await screen.findByText('الكود النظيف')).closest('a')
  expect(card).toHaveAttribute('href', '/library/clean-code')
  expect(within(card).getByText('روبرت مارتن')).toBeInTheDocument()
  expect(within(card).getByText(t.libReaders(25))).toBeInTheDocument()
})

test('says so when the library is empty', async () => {
  api.getBooks.mockResolvedValue([])
  renderAt('/library')

  expect(await screen.findByText(t.libEmpty)).toBeInTheDocument()
})

test('shows the description, details and the read / download buttons', async () => {
  renderAt('/library/clean-code')

  expect(await screen.findByRole('heading', { level: 1, name: 'الكود النظيف' })).toBeInTheDocument()
  expect(screen.getByText('كتاب عن كتابة كود مقروء')).toBeInTheDocument()
  expect(screen.getByText('464')).toBeInTheDocument()
  expect(screen.getByText('3.3 MB')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: t.libRead })).toHaveAttribute('href', '/library/clean-code/read')
  expect(screen.getByRole('link', { name: t.libDownload })).toHaveAttribute('href', book.download_url)
})

test('hides the download button when the book is read-only', async () => {
  api.getBook.mockResolvedValue({ ...book, download_url: null })
  renderAt('/library/clean-code')

  await screen.findByRole('heading', { level: 1 })
  expect(screen.queryByRole('link', { name: t.libDownload })).toBeNull()
})

test('reads the book on the site: every page, the counter, and one reader counted per browser', async () => {
  const first = renderAt('/library/clean-code/read')

  await waitFor(() => expect(document.querySelectorAll('[data-page]')).toHaveLength(3))
  expect(openPdf).toHaveBeenCalledWith(book.file_url)
  expect(screen.getByText(t.readerPage(1, 3))).toBeInTheDocument()
  await waitFor(() => expect(api.readBook).toHaveBeenCalledTimes(1))
  expect(api.readBook).toHaveBeenCalledWith('clean-code')

  first.unmount()
  renderAt('/library/clean-code/read')
  await waitFor(() => expect(document.querySelectorAll('[data-page]')).toHaveLength(3))
  expect(api.readBook).toHaveBeenCalledTimes(1) // the same browser is not counted twice
})

test('says so when the PDF cannot be opened', async () => {
  openPdf.mockRejectedValue(new Error('broken'))
  renderAt('/library/clean-code/read')

  expect(await screen.findByText(t.readerError)).toBeInTheDocument()
  expect(api.readBook).not.toHaveBeenCalled()
})

test('formats file sizes', () => {
  expect(fileSize(3_500_000)).toBe('3.3 MB')
  expect(fileSize(820 * 1024)).toBe('820 KB')
  expect(fileSize(null)).toBe('')
})
