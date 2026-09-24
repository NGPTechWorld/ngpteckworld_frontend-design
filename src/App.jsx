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
      {/* Column layout with the page area growing: that is what keeps the footer on the bottom
          edge of the viewport on a short page, instead of riding up under the content and
          leaving a band of background beneath it. It also stops the footer jumping while a
          lazily-loaded route is still resolving. */}
      <div className="ngp-app">
        <Navbar />
        <main className="ngp-main">
          <Suspense fallback={<div style={{ minHeight: '50vh' }} />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </div>
  )
}
