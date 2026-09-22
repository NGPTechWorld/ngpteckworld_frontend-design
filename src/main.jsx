import React, { lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { ContentProvider } from './lib/SiteContent'
import { SiteSettingsProvider } from './lib/SiteSettings'
import App from './App'
import './index.css'

// Route-level code splitting: each page ships as its own chunk.
const Home = lazy(() => import('./pages/Home'))
const Services = lazy(() => import('./pages/Services'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))

const router = createBrowserRouter([
  { path: '/', element: <App />, children: [
    { index: true, element: <Home /> },
    { path: 'services', element: <Services /> },
    { path: 'portfolio', element: <Portfolio /> },
    { path: 'portfolio/:slug', element: <ProjectDetail /> },
    { path: 'about', element: <About /> },
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
        </SiteSettingsProvider>
      </LanguageProvider>
    </ContentProvider>
  </React.StrictMode>,
)
