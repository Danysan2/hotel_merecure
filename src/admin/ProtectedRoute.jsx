import { Navigate, useLocation } from 'react-router-dom'
import { getSession } from './auth'

const ProtectedRoute = ({ children }) => {
  const user     = getSession()
  const location = useLocation()

  if (!user) {
    // Si venía del dashboard (sesión expirada), avisa en el login
    const expired = location.pathname.startsWith('/admin/dashboard')
    return <Navigate to="/admin" replace state={{ expired }} />
  }

  return children
}

export default ProtectedRoute
