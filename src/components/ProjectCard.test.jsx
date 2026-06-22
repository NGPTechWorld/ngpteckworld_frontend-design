import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../i18n/LanguageContext'
import ProjectCard from './ProjectCard'

const project = { slug: 'demo', category: 'web', year: 2024, status: 'completed',
  name_ar: 'مشروع', name_en: 'Demo', short_ar: 'وصف', short_en: 'desc', cover_image: null }

test('renders arabic name and links to detail', () => {
  render(<LanguageProvider><MemoryRouter><ProjectCard project={project} /></MemoryRouter></LanguageProvider>)
  expect(screen.getByText('مشروع')).toBeInTheDocument()
  expect(screen.getByRole('link')).toHaveAttribute('href', '/portfolio/demo')
})
