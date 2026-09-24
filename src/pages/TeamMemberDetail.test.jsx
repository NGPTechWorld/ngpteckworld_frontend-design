import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from '../i18n/LanguageContext'
import { api } from '../lib/api'
import TeamMemberDetail from './TeamMemberDetail'

vi.mock('../lib/api', () => ({ api: { getTeamMember: vi.fn() } }))

const member = {
  id: 1, slug: 'sara',
  name_ar: 'سارة', name_en: 'Sara', job_title_ar: 'مطورة', job_title_en: 'Developer', bio_ar: 'نبذة', bio_en: 'Bio',
  avatar: null, location_ar: null, location_en: null, department_ar: null, department_en: null, years_experience: null,
  skills: [{ title_ar: 'قيادة الفرق', title_en: 'Team Leader', description_ar: 'إدارة الفرق', description_en: 'Managing teams' }],
  experience: [{
    title_ar: 'مطورة', title_en: 'Flutter Developer', company_ar: 'شركة', company_en: 'QuickSale',
    location_ar: 'دمشق', location_en: 'Damascus, Syria', description_ar: null, description_en: null,
    start: '2025-06', end: '2025-08', current: false,
  }],
  education: [{
    degree_ar: 'بكالوريوس', degree_en: "Bachelor's in IT", school_ar: 'جامعة دمشق', school_en: 'Damascus University',
    location_ar: null, location_en: null, description_ar: null, description_en: null, start: '2022-10', end: null, current: true,
  }],
  certifications: [{ title_ar: 'مسابقة', title_en: 'DCPC 2024', description_ar: null, description_en: 'Programming contest', url: 'https://example.com/cert' }],
  languages: [{ name_ar: 'العربية', name_en: 'Arabic', level_ar: 'اللغة الأم', level_en: 'Native' }],
  social_links: [
    { platform: 'github', url: 'https://github.com/sara', label: null },
    { platform: 'other', url: 'https://sara.dev', label: 'Blog' },
    { platform: 'x', url: 'javascript:alert(1)', label: null },
  ],
  portfolio: [],
}

const renderPage = () =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/team/sara']}>
        <Routes><Route path="/team/:slug" element={<TeamMemberDetail />} /></Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('lang', 'en')
  api.getTeamMember.mockReset().mockResolvedValue(member)
})

test('renders every CV section as structured entries', async () => {
  renderPage()

  expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  // whichever language the page starts in, the entries of that language are shown
  const texts = document.body.textContent
  expect(texts).toMatch(/Team Leader|قيادة الفرق/)
  expect(texts).toMatch(/06\/2025 – 08\/2025/)
  expect(texts).toMatch(/10\/2022 – (Present|حاليًا)/)
  expect(texts).toMatch(/DCPC 2024|مسابقة/)
  expect(texts).toMatch(/Arabic|العربية/)
})

test('links only to http(s) social links, with the label of an "other" link', async () => {
  renderPage()
  await screen.findByRole('heading', { level: 1 })

  const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
  expect(hrefs).toContain('https://github.com/sara')
  expect(hrefs).toContain('https://sara.dev/')
  expect(hrefs).toContain('https://example.com/cert')
  expect(hrefs.some((href) => href?.startsWith('javascript:'))).toBe(false)
  expect(screen.getByText('Blog')).toBeInTheDocument()
})
