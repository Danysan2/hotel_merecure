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
  const [stats, setStats]       = useState({ totalRes: 0, guests: 0, revenue: 0 })
  const [chartData, setChartData] = useState([])
  const [filter, setFilter]     = useState('personas')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const today      = new Date().toISOString().split('T')[0]
      const sixMoAgo   = new Date(); sixMoAgo.setMonth(sixMoAgo.getMonth() - 5); sixMoAgo.setDate(1)
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)

      // ── 5 queries en paralelo ──────────────────────────────
      const [
        activeStatusRes,
        activeReservationsRes,
        paymentsMonthRes,
        allReservationsRes,
        allPaymentsRes,
      ] = await Promise.all([
        // 1. IDs de estados activos
        supabase.from('reservation_statuses').select('id').in('name', ['confirmada','activa']),

        // 2. Reservas activas HOY (para personas alojadas)
        supabase.from('reservations')
          .select('num_guests, status_id')
          .lte('check_in', today)
          .gt('check_out', today),

        // 3. Pagos del mes actual
        supabase.from('payments').select('amount').gte('paid_at', startOfMonth.toISOString()),

        // 4. Todas las reservas de los últimos 6 meses (para gráfico)
        supabase.from('reservations')
          .select('num_guests, status_id, created_at')
          .gte('created_at', sixMoAgo.toISOString()),

        // 5. Todos los pagos de los últimos 6 meses (para gráfico)
        supabase.from('payments')
          .select('amount, paid_at')
          .gte('paid_at', sixMoAgo.toISOString()),
      ])

      const activeIds = (activeStatusRes.data || []).map(s => s.id)

      // Personas alojadas ahora
      const guests = (activeReservationsRes.data || [])
        .filter(r => activeIds.includes(r.status_id))
        .reduce((s, r) => s + r.num_guests, 0)

      // Ingresos del mes
      const revenue = (paymentsMonthRes.data || [])
        .reduce((s, p) => s + Number(p.amount), 0)

      // Total reservas activas
      const totalRes = (activeReservationsRes.data || [])
        .filter(r => activeIds.includes(r.status_id)).length

      // ── Agrupar por mes en JS ──────────────────────────────
      const now = new Date()
      const monthData = []

      for (let i = 5; i >= 0; i--) {
        const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const year  = d.getFullYear()
        const month = d.getMonth()

        const resCount = (allReservationsRes.data || []).filter(r => {
          const rd = new Date(r.created_at)
          return rd.getFullYear() === year && rd.getMonth() === month
        }).length

        const monthGuests = (allReservationsRes.data || [])
          .filter(r => { const rd = new Date(r.created_at); return rd.getFullYear() === year && rd.getMonth() === month })
          .reduce((s, r) => s + r.num_guests, 0)

        const monthRevenue = (allPaymentsRes.data || [])
          .filter(p => { const pd = new Date(p.paid_at); return pd.getFullYear() === year && pd.getMonth() === month })
          .reduce((s, p) => s + Number(p.amount), 0)

        monthData.push({ mes: MONTHS[month], reservas: resCount, personas: monthGuests, dinero: monthRevenue })
      }

      setStats({ totalRes, guests, revenue })
      setChartData(monthData)
      setLoading(false)
    }

    load()
  }, [])

  const chartKey   = filter === 'personas' ? 'personas' : 'dinero'
  const chartLabel = filter === 'personas' ? 'Personas alojadas' : 'Ingresos (COP)'
  const chartColor = filter === 'personas' ? '#2A5C4E' : '#C9A96E'

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
                  stroke="#1A3C34" strokeWidth={2.5} dot={{ r: 4, fill: '#1A3C34' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey={chartKey} name={chartLabel}
                  stroke={chartColor} strokeWidth={2.5} dot={{ r: 4, fill: chartColor }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </>
  )
}

export default DashboardHome
