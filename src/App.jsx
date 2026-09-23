import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ScrollFX from './components/ScrollFX'
import SiteBackdrop from './components/fx/SiteBackdrop'

export default function App() {
  return (
    <div style={{ background: 'var(--page-bg)', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      {/* Replaces the two static radial gradients that used to live here: same job — stop the page
          reading as flat — but drifting, and with the circuit lattice the brand is built around. */}
      <SiteBackdrop />
      <ScrollFX />
      <ScrollToTop />
      <div className="ngp-app">
        <Navbar />
        <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
          <Outlet />
        </Suspense>
        <Footer />
      </div>
    </div>
  )
}
