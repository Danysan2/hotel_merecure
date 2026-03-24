import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getSession, clearSession } from './auth'
import NewReservationModal from './NewReservationModal.jsx'
import EditReservationModal from './EditReservationModal.jsx'
import DashboardHome from './DashboardHome.jsx'
import './AdminDashboard.css'

const fmt = (d) => d
  ? new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

const getDateRange = (filter) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (filter === 'hoy') {
    const end = new Date(today); end.setHours(23, 59, 59, 999)
    return { start: today.toISOString(), end: end.toISOString() }
  }
  if (filter === 'semana') {
    const end = new Date(today); end.setDate(today.getDate() + 6); end.setHours(23, 59, 59, 999)
    return { start: today.toISOString(), end: end.toISOString() }
  }
  if (filter === 'mes') {
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start: today.toISOString(), end: end.toISOString() }
  }
  return { start: today.toISOString(), end: null }
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const user     = getSession() || {}

  const [view, setView]               = useState('home')
  const [filter, setFilter]           = useState('hoy')
  const [rooms, setRooms]             = useState([])
  const [reservations, setReservations] = useState([])
  const [showNew, setShowNew]         = useState(false)
  const [preselectedRoom, setPreselectedRoom] = useState(null)
  const [editRoom, setEditRoom]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [deletingId, setDeletingId]   = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [page, setPage]               = useState(0)
  const [hasMore, setHasMore]         = useState(false)
  const [toast, setToast]             = useState(null)   // { msg, type: 'error'|'success' }
  const [confirmDialog, setConfirmDialog] = useState(null) // { reservationId, label }
  const PAGE_SIZE = 25

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadRooms = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('room_status').select('*')
      if (error) throw new Error(error.message)
      setRooms(data || [])
    } catch (err) {
      console.error('[AdminDashboard] loadRooms:', err)
      showToast('Error al cargar las habitaciones. Intenta recargar.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadReservations = useCallback(async (f, p = 0) => {
    setLoading(true)
    try {
      const { start, end } = getDateRange(f)
      const { data: statuses, error: stErr } = await supabase
        .from('reservation_statuses')
        .select('id')
        .in('name', ['confirmada', 'activa'])
      if (stErr) throw new Error(stErr.message)
      const ids = (statuses || []).map(s => s.id)

      let query = supabase
        .from('reservations')
        .select(`
          id, check_in, check_out, num_guests, source, notes,
          guests(first_name, last_name, phone, email),
          rooms(room_number, floor, room_types(name)),
          reservation_statuses(name)
        `)
        .in('status_id', ids)
        .gte('check_out', start.split('T')[0])

      if (end) query = query.lte('check_in', end.split('T')[0])

      const from = p * PAGE_SIZE
      const { data, error: qErr } = await query
        .order('check_in', { ascending: true })
        .range(from, from + PAGE_SIZE)

      if (qErr) throw new Error(qErr.message)

      const rows = data || []
      const moreExist = rows.length === PAGE_SIZE + 1
      // Un solo setState: recortamos el +1 explorador en el mismo update
      const displayRows = moreExist ? rows.slice(0, -1) : rows
      setReservations(prev => p === 0 ? displayRows : [...prev, ...displayRows])
      setHasMore(moreExist)
      setPage(p)
    } catch (err) {
      console.error('[AdminDashboard] loadReservations:', err)
    } finally {
      setLoading(false)
    }
  }, [PAGE_SIZE])

  useEffect(() => { loadRooms() }, [loadRooms])

  useEffect(() => {
    if (view === 'rooms' && filter === 'hoy') loadRooms()
    else if (view === 'rooms') { setPage(0); loadReservations(filter, 0) }
  }, [view, filter, loadRooms, loadReservations])

  const handleLogout = () => {
    clearSession()
    navigate('/admin')
  }

  const handleCancel = async (reservationId) => {
    setConfirmDialog(null)
    setDeletingId(reservationId)
    try {
      const { data: st, error: stErr } = await supabase
        .from('reservation_statuses').select('id').eq('name', 'cancelada').single()
      if (stErr || !st) {
        showToast('No se encontró el estado "cancelada". Contacta al administrador.')
        return
      }
      const { error: upErr } = await supabase
        .from('reservations').update({ status_id: st.id }).eq('id', reservationId)
      if (upErr) {
        showToast(`Error al cancelar: ${upErr.message}`)
      } else {
        showToast('Reserva cancelada correctamente.', 'success')
      }
    } catch (e) {
      showToast(`Error inesperado: ${e.message}`)
    } finally {
      setDeletingId(null)
      filter === 'hoy' ? loadRooms() : loadReservations(filter)
    }
  }

  const navTo = (v) => { setView(v); if (v === 'rooms') setFilter('hoy'); setSidebarOpen(false) }

  const occupied  = rooms.filter(r => r.is_occupied).length
  const available = rooms.filter(r => !r.is_occupied).length

  return (
    <div className="admin-layout">

      {/* Overlay móvil */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sb-logo">HOTEL</span>
          <span className="sb-sub">MERECURE</span>
        </div>
        <nav className="sidebar-nav">
          <button className={`sidebar-link ${view === 'home' ? 'active' : ''}`} onClick={() => navTo('home')}>
            <span className="material-icons">dashboard</span>Dashboard
          </button>
          <button className={`sidebar-link ${view === 'rooms' ? 'active' : ''}`} onClick={() => navTo('rooms')}>
            <span className="material-icons">meeting_room</span>Habitaciones
          </button>
          <button className="sidebar-link" onClick={() => { setShowNew(true); setSidebarOpen(false) }}>
            <span className="material-icons">add_circle</span>Nueva Reserva
          </button>
        </nav>
        <div className="sidebar-user">
          <div className="su-avatar"><span className="material-icons">person</span></div>
          <div className="su-info">
            <span className="su-name">{user.full_name}</span>
            <span className="su-role">{user.role_name}</span>
          </div>
          <button className="su-logout" onClick={handleLogout} title="Cerrar sesión">
            <span className="material-icons">logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">

        {/* Top bar móvil */}
        <div className="mobile-topbar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <span className="material-icons">menu</span>
          </button>
          <span className="mobile-topbar-title">
            {view === 'home' ? 'Dashboard' : 'Habitaciones'}
          </span>
          <button className="mobile-new-btn" onClick={() => setShowNew(true)}>
            <span className="material-icons">add</span>
          </button>
        </div>

        {view === 'home' && (
          <DashboardHome rooms={rooms} occupied={occupied} available={available} onNewReservation={() => setShowNew(true)} />
        )}

        {view === 'rooms' && (
          <>
            {/* Filtros visibles en móvil (el header desktop está oculto) */}
            <div className="mobile-filters">
              <p className="mobile-filters-sub">{occupied} ocupadas · {available} disponibles</p>
              <div className="filter-tabs">
                {['hoy', 'semana', 'mes', 'todo'].map(f => (
                  <button
                    key={f}
                    className={`filter-tab ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <header className="admin-header">
              <div>
                <h1 className="admin-page-title">Habitaciones</h1>
                <p className="admin-page-sub">{occupied} ocupadas · {available} disponibles</p>
              </div>
              <div className="rooms-header-right">
                <div className="filter-tabs">
                  {['hoy', 'semana', 'mes', 'todo'].map(f => (
                    <button
                      key={f}
                      className={`filter-tab ${filter === f ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <button className="btn-new-res desktop-only-btn" onClick={() => setShowNew(true)}>
                  <span className="material-icons">add</span>Nueva Reserva
                </button>
              </div>
            </header>

            {loading ? (
              <div className="admin-loading">
                <span className="material-icons spinning">autorenew</span>Cargando...
              </div>
            ) : filter === 'hoy' ? (
              <div className="rooms-grid">
                {rooms.map((room) => (
                  <div key={room.id} className={`room-card-admin ${room.is_occupied ? 'occupied' : 'available'}`}>
                    <div className="rca-header">
                      <div className="rca-number">#{room.room_number}</div>
                      <div className="rca-header-right">
                        <span className={`rca-badge ${room.is_occupied ? 'badge-occ' : 'badge-avail'}`}>
                          {room.is_occupied ? 'Ocupada' : 'Disponible'}
                        </span>
                        {room.is_occupied && (
                          <div className="rca-actions">
                            <button className="rca-action-btn edit" title="Editar reserva" onClick={() => setEditRoom(room)}>
                              <span className="material-icons">edit</span>
                            </button>
                            <button
                              className="rca-action-btn delete" title="Cancelar reserva"
                              disabled={deletingId === room.reservation_id}
                              onClick={() => setConfirmDialog({ reservationId: room.reservation_id, label: `hab. #${room.room_number}` })}
                            >
                              <span className="material-icons">
                                {deletingId === room.reservation_id ? 'hourglass_empty' : 'cancel'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="rca-type">{room.room_type} · Piso {room.floor}</p>
                    {room.is_occupied ? (
                      <div className="rca-guest">
                        <div className="rca-guest-name">
                          <span className="material-icons">person</span>
                          {room.first_name} {room.last_name}
                        </div>
                        {room.phone && (
                          <div className="rca-guest-phone">
                            <span className="material-icons">phone</span>{room.phone}
                          </div>
                        )}
                        <div className="rca-dates">
                          <div className="rca-date-block">
                            <span className="rca-date-label">Check-in</span>
                            <span className="rca-date-val">{fmt(room.check_in)}</span>
                          </div>
                          <span className="material-icons rca-arrow">arrow_forward</span>
                          <div className="rca-date-block">
                            <span className="rca-date-label">Check-out</span>
                            <span className="rca-date-val">{fmt(room.check_out)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rca-empty">
                        <button className="rca-reserve-btn" onClick={() => { setPreselectedRoom(room); setShowNew(true) }}>
                          <span className="material-icons">add</span>Reservar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="res-list">
                {reservations.length === 0 ? (
                  <div className="res-list-empty">
                    <span className="material-icons">event_busy</span>
                    <p>No hay reservas agendadas para {
                      filter === 'semana' ? 'esta semana' :
                      filter === 'mes'    ? 'este mes' : 'el futuro'
                    }</p>
                  </div>
                ) : reservations.map(r => (
                  <div key={r.id} className="res-list-item">
                    <div className="rli-room">
                      <span className="rli-room-num">#{r.rooms?.room_number}</span>
                      <span className="rli-room-type">{r.rooms?.room_types?.name} · Piso {r.rooms?.floor}</span>
                    </div>
                    <div className="rli-guest">
                      <span className="material-icons">person</span>
                      <div>
                        <span className="rli-name">{r.guests?.first_name} {r.guests?.last_name}</span>
                        {r.guests?.phone && <span className="rli-phone">{r.guests.phone}</span>}
                      </div>
                    </div>
                    <div className="rli-dates">
                      <div className="rli-date-block">
                        <span className="rli-date-label">Check-in</span>
                        <span className="rli-date-val">{fmt(r.check_in)}</span>
                      </div>
                      <span className="material-icons" style={{ color: '#C9A96E', fontSize: '1rem' }}>arrow_forward</span>
                      <div className="rli-date-block">
                        <span className="rli-date-label">Check-out</span>
                        <span className="rli-date-val">{fmt(r.check_out)}</span>
                      </div>
                    </div>
                    <div className="rli-meta">
                      <span className={`rli-source ${r.source === 'web' ? 'src-web' : 'src-presencial'}`}>
                        {r.source === 'web' ? '🌐 Web' : '🏨 Presencial'}
                      </span>
                      <span className="rli-guests-count">
                        <span className="material-icons">group</span>{r.num_guests}
                      </span>
                    </div>
                    <div className="rli-actions">
                      <button className="rca-action-btn edit" title="Editar" onClick={() => setEditRoom({
                        id: r.rooms?.id,
                        room_number: r.rooms?.room_number,
                        reservation_id: r.id,
                        check_in: r.check_in,
                        check_out: r.check_out,
                        first_name: r.guests?.first_name,
                        last_name: r.guests?.last_name,
                      })}>
                        <span className="material-icons">edit</span>
                      </button>
                      <button
                        className="rca-action-btn delete" title="Cancelar"
                        disabled={deletingId === r.id}
                        onClick={() => setConfirmDialog({ reservationId: r.id, label: `${r.guests?.first_name} ${r.guests?.last_name}` })}
                      >
                        <span className="material-icons">
                          {deletingId === r.id ? 'hourglass_empty' : 'cancel'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <button
                    className="load-more-btn"
                    onClick={() => loadReservations(filter, page + 1)}
                    disabled={loading}
                  >
                    <span className="material-icons">expand_more</span>
                    Ver más reservas
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {showNew && (
        <NewReservationModal
          onClose={() => { setShowNew(false); setPreselectedRoom(null) }}
          onSuccess={() => { setShowNew(false); setPreselectedRoom(null); filter === 'hoy' ? loadRooms() : loadReservations(filter) }}
          staffId={user.id}
          preselectedRoom={preselectedRoom}
        />
      )}
      {editRoom && (
        <EditReservationModal room={editRoom} onClose={() => setEditRoom(null)}
          onSuccess={() => { setEditRoom(null); filter === 'hoy' ? loadRooms() : loadReservations(filter) }} />
      )}

      {/* ── Diálogo de confirmación ── */}
      {confirmDialog && (
        <div className="confirm-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <span className="material-icons confirm-icon">warning</span>
            <h3>¿Cancelar reserva?</h3>
            <p>Se cancelará la reserva de <strong>{confirmDialog.label}</strong>. Esta acción no se puede deshacer.</p>
            <div className="confirm-actions">
              <button className="confirm-btn-sec" onClick={() => setConfirmDialog(null)}>No, volver</button>
              <button className="confirm-btn-pri" onClick={() => handleCancel(confirmDialog.reservationId)}>
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`admin-toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          <span className="material-icons">
            {toast.type === 'success' ? 'check_circle' : 'error_outline'}
          </span>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
