import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { saveSession } from './auth'
import './AdminLogin.css'

const AdminLogin = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()
  const sessionExpired = location.state?.expired === true

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: rpcError } = await supabase.rpc('login_staff', {
        p_username: username,
        p_password: password,
      })

      if (rpcError) {
        // Error del servidor (función SQL, conexión, etc.)
        console.error('[AdminLogin] RPC error:', rpcError)
        setError('Error al conectar con el servidor. Intenta de nuevo.')
        return
      }

      if (!data || data.length === 0) {
        setError('Usuario o contraseña incorrectos.')
        return
      }

      saveSession(data[0])
      navigate('/admin/dashboard')
    } catch (err) {
      // Error de red o fallo inesperado
      console.error('[AdminLogin] Error inesperado:', err)
      setError('Sin conexión. Verifica tu red e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-logo-text">HOTEL</span>
          <span className="login-logo-sub">MERECURE</span>
        </div>
        <h2 className="login-title">Panel de Administración</h2>
        <p className="login-subtitle">Ingresa tus credenciales para continuar</p>

        {sessionExpired && (
          <div className="login-expired">
            <span className="material-icons">timer_off</span>
            Tu sesión expiró. Por favor inicia sesión de nuevo.
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field">
            <label>Usuario</label>
            <div className="login-input-wrap">
              <span className="material-icons">person</span>
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="login-field">
            <label>Contraseña</label>
            <div className="login-input-wrap">
              <span className="material-icons">lock</span>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
