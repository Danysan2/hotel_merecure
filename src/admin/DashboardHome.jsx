import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import './DashboardHome.css'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

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
        const today        = new Date().toISOString().split('T')[0]
        const sixMoAgo     = new Date(); sixMoAgo.setMonth(sixMoAgo.getMonth() - 5); sixMoAgo.setDate(1)
        const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)

        const [activeStatusRes, activeReservationsRes, allReservationsRes] = await Promise.all([
          supabase.from('reservation_statuses').select('id, name'),
          supabase.from('reservations').select('num_guests, status_id').lte('check_in', today).gt('check_out', today),
          supabase.from('reservations').select('num_guests, status_id, created_at, total_price, check_in').gte('created_at', sixMoAgo.toISOString()),
        ])

        if (activeStatusRes.error)      throw new Error('Error al cargar estados: '    + activeStatusRes.error.message)
        if (activeReservationsRes.error) throw new Error('Error al cargar reservas: '  + activeReservationsRes.error.message)
        if (allReservationsRes.error)   throw new Error('Error al cargar historial: '  + allReservationsRes.error.message)

        const activeIds   = (activeStatusRes.data || []).filter(s => ['confirmada','activa'].includes(s.name)).map(s => s.id)
        const cancelledId = (activeStatusRes.data || []).find(s => s.name === 'cancelada')?.id

        const guests = (activeReservationsRes.data || [])
          .filter(r => activeIds.includes(r.status_id))
          .reduce((s, r) => s + r.num_guests, 0)

        const revenue = (allReservationsRes.data || [])
          .filter(r => { const rd = new Date(r.created_at); return rd >= startOfMonth && r.status_id !== cancelledId })
          .reduce((s, r) => s + Number(r.total_price || 0), 0)

        const totalRes = (activeReservationsRes.data || [])
          .filter(r => activeIds.includes(r.status_id)).length

        const now = new Date()
        const monthData = []
        for (let i = 5; i >= 0; i--) {
          const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const year  = d.getFullYear()
          const month = d.getMonth()
          const monthRes = (allReservationsRes.data || []).filter(r => {
            const rd = new Date(r.created_at)
            return rd.getFullYear() === year && rd.getMonth() === month && r.status_id !== cancelledId
          })
          monthData.push({
            mes:      MONTHS[month],
            reservas: monthRes.length,
            personas: monthRes.reduce((s, r) => s + r.num_guests, 0),
            dinero:   monthRes.reduce((s, r) => s + Number(r.total_price || 0), 0),
          })
        }

        setStats({ totalRes, guests, revenue })
        setChartData(monthData)
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
