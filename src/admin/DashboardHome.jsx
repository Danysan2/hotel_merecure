import { useState, useEffect } from 'react'
import { adminApi } from '../lib/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import './DashboardHome.css'

const CustomTooltip = ({ active, payload, label, filter }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="ct-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>
            {filter === 'dinero'
              ? p.value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
              : p.value}
          </strong>
        </p>
      ))}
    </div>
  )
}

const DashboardHome = ({ rooms, occupied, available, onNewReservation }) => {
  const [stats, setStats]         = useState({ totalRes: 0, guests: 0, revenue: 0 })
  const [chartData, setChartData] = useState([])
  const [filter, setFilter]       = useState('personas')
  const [loading, setLoading]     = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setLoadError('')

      try {
        const data = await adminApi.getDashboard()
        setStats(data.stats)
        setChartData(data.chartData)
      } catch (err) {
        console.error('[DashboardHome] Error al cargar datos:', err)
        setLoadError('No se pudieron cargar los datos. Verifica tu conexión y recarga la página.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const chartKey   = filter === 'personas' ? 'personas' : 'dinero'
  const chartLabel = filter === 'personas' ? 'Personas alojadas' : 'Ingresos (COP)'
  const chartColor = '#F7834F'

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-sub">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button className="btn-new-res" onClick={onNewReservation}>
          <span className="material-icons">add</span>Nueva Reserva
        </button>
      </header>

      {loading ? (
        <div className="admin-loading">
          <span className="material-icons spinning">autorenew</span>Cargando...
        </div>
      ) : loadError ? (
        <div className="dash-error">
          <span className="material-icons">cloud_off</span>
          <p>{loadError}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-total">
              <div className="stat-icon"><span className="material-icons">receipt_long</span></div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalRes}</span>
                <span className="stat-label">Total reservas activas</span>
              </div>
            </div>
            <div className="stat-card stat-occupied">
              <div className="stat-icon"><span className="material-icons">hotel</span></div>
              <div className="stat-info">
                <span className="stat-value">{occupied}</span>
                <span className="stat-label">Habitaciones ocupadas</span>
              </div>
            </div>
            <div className="stat-card stat-available">
              <div className="stat-icon"><span className="material-icons">check_circle</span></div>
              <div className="stat-info">
                <span className="stat-value">{available}</span>
                <span className="stat-label">Habitaciones disponibles</span>
              </div>
            </div>
            <div className="stat-card stat-guests">
              <div className="stat-icon"><span className="material-icons">groups</span></div>
              <div className="stat-info">
                <span className="stat-value">{stats.guests}</span>
                <span className="stat-label">Personas alojadas ahora</span>
              </div>
            </div>
            <div className="stat-card stat-revenue">
              <div className="stat-icon"><span className="material-icons">payments</span></div>
              <div className="stat-info">
                <span className="stat-value">
                  {stats.revenue.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </span>
                <span className="stat-label">Ingresos del mes</span>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Reservas de los últimos 6 meses</h3>
                <p className="chart-sub">Comportamiento mensual del hotel</p>
              </div>
              <div className="chart-filters">
                <button className={`filter-btn ${filter === 'personas' ? 'active' : ''}`} onClick={() => setFilter('personas')}>
                  <span className="material-icons">groups</span>Personas
                </button>
                <button className={`filter-btn ${filter === 'dinero' ? 'active' : ''}`} onClick={() => setFilter('dinero')}>
                  <span className="material-icons">payments</span>Ingresos
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6B6B6B' }} axisLine={false} tickLine={false}
                  tickFormatter={filter === 'dinero' ? (v) => `$${(v/1000).toFixed(0)}k` : undefined} />
                <Tooltip content={<CustomTooltip filter={filter} />} />
                <Legend />
                <Line type="monotone" dataKey="reservas" name="Reservas"
                  stroke="#6366F1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366F1' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey={chartKey} name={chartLabel}
                  stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </>
  )
}

export default DashboardHome
