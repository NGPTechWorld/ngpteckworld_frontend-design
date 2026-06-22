import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import App from './App'
import Home from './pages/Home'
import Services from './pages/Services'
import Portfolio from './pages/Portfolio'
import ProjectDetail from './pages/ProjectDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import './index.css'

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
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  </React.StrictMode>,
)
