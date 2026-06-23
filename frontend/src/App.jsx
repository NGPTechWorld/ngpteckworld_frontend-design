import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ScrollFX from './components/ScrollFX'

export default function App() {
  return (
    <div style={{ background: 'var(--page-bg)', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(820px 480px at 84% -6%,rgba(107,78,142,.28),transparent 60%),radial-gradient(680px 460px at 6% 22%,rgba(107,78,142,.14),transparent 55%)' }} />
      <ScrollFX />
      <ScrollToTop />
      <Navbar />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
