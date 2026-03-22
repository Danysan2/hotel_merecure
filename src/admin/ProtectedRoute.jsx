import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const user = sessionStorage.getItem('admin_user')
  if (!user) return <Navigate to="/admin" replace />
  return children
}

export default ProtectedRoute
