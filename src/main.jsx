import React, { lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { LanguageProvider } from './i18n/LanguageContext'
import { ContentProvider } from './lib/SiteContent'
import { SectionGate, SiteSettingsProvider } from './lib/SiteSettings'
import App from './App'
import './index.css'

// Route-level code splitting: each page ships as its own chunk.
const Home = lazy(() => import('./pages/Home'))
const Services = lazy(() => import('./pages/Services'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Team = lazy(() => import('./pages/Team'))
const TeamMemberDetail = lazy(() => import('./pages/TeamMemberDetail'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Pages the dashboard can switch off (Site settings → Website sections): hidden ones answer as 404.
const gated = (section, page) => <SectionGate section={section} fallback={<NotFound />}>{page}</SectionGate>

const router = createBrowserRouter([
  { path: '/', element: <App />, children: [
    { index: true, element: <Home /> },
    { path: 'services', element: gated('services', <Services />) },
    { path: 'portfolio', element: gated('portfolio', <Portfolio />) },
    { path: 'portfolio/:slug', element: gated('portfolio', <ProjectDetail />) },
    { path: 'team', element: gated('team', <Team />) },
    { path: 'team/:slug', element: gated('team', <TeamMemberDetail />) },
    { path: 'about', element: gated('about', <About />) },
    { path: 'contact', element: <Contact /> },
    { path: '*', element: <NotFound /> },
  ]},
])

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <ContentProvider>
      <LanguageProvider>
        <SiteSettingsProvider>
          <RouterProvider router={router} />
          {/* Vercel Analytics. `/react`, not `/next` — this app is Vite and React Router, and the
              Next entry point reaches for a router that does not exist here. It is mounted outside
              <App /> so it keeps reporting while the pre-launch countdown is holding the site
              closed, and it is a private dashboard: the number in the footer comes from our own
              API, not from this. */}
          <Analytics />
        </SiteSettingsProvider>
      </LanguageProvider>
    </ContentProvider>
  </React.StrictMode>,
)
