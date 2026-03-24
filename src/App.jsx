import { useEffect, Component } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import WhyChoose from './components/WhyChoose.jsx'
import Rooms from './components/Rooms.jsx'
import Hotel from './components/Hotel.jsx'
import Testimonials from './components/Testimonials.jsx'
import Newsletter from './components/Newsletter.jsx'
import Footer from './components/Footer.jsx'
import AdminLogin from './admin/AdminLogin.jsx'
import AdminDashboard from './admin/AdminDashboard.jsx'
import ProtectedRoute from './admin/ProtectedRoute.jsx'
import ReservarPage from './pages/ReservarPage.jsx'
import './App.css'

// ── Error Boundary ───────────────────────────────────────────
// Captura errores inesperados en cualquier componente hijo
// y muestra una pantalla amigable en vez de crashear toda la app
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#f7f4f0', fontFamily: 'Inter, sans-serif', padding: '2rem', textAlign: 'center'
        }}>
          <span style={{ fontSize: '3rem', color: '#C9A96E' }} className="material-icons">hotel</span>
          <h2 style={{ color: '#1A3C34', marginTop: '1rem' }}>Algo salió mal</h2>
          <p style={{ color: '#666', maxWidth: '400px', lineHeight: 1.6 }}>
            Ocurrió un error inesperado. Por favor recarga la página. Si el problema persiste,
            contáctanos al <strong>+57 317 698 0346</strong>.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#1A3C34',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '0.95rem', cursor: 'pointer'
            }}
          >
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible')
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    const elements = document.querySelectorAll('.animate-on-scroll')
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="app">
      <Navbar />
      <Hero />
      <WhyChoose />
      <Rooms />
      <Hotel />
      <Testimonials />
      <Newsletter />
      <Footer />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/reservar" element={<ReservarPage />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
