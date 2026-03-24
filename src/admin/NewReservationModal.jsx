import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './NewReservationModal.css'

const EMPTY_GUEST = { first_name: '', last_name: '', document_type_id: '', document_number: '', phone: '', email: '' }
const EMPTY_RES   = { room_id: '', check_in: '', check_out: '', num_guests: 1, notes: '' }

const NewReservationModal = ({ onClose, onSuccess, staffId, preselectedRoom }) => {
  const [step, setStep]             = useState(1)
  const [guest, setGuest]           = useState(EMPTY_GUEST)
  const [res, setRes]               = useState(() => preselectedRoom ? { ...EMPTY_RES, room_id: String(preselectedRoom.id) } : EMPTY_RES)
  const [docTypes, setDocTypes]     = useState([])
  const [rooms, setRooms]           = useState([])
  const [statusId, setStatusId]     = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const [roomTypes, setRoomTypes] = useState([])

  useEffect(() => {
    supabase.from('document_types').select('id, code, name')
      .then(({ data, error }) => {
        if (error) console.error('[Modal] document_types:', error.message)
        else setDocTypes(data || [])
      })

    if (!preselectedRoom) {
      supabase.from('room_status').select('id, room_number, floor, room_type, is_occupied')
        .then(({ data, error }) => {
          if (error) console.error('[Modal] room_status:', error.message)
          else setRooms(data || [])
        })
    }

    supabase.from('reservation_statuses').select('id, name').eq('name', 'confirmada').single()
      .then(({ data, error }) => {
        if (error) console.error('[Modal] reservation_statuses:', error.message)
        else setStatusId(data?.id)
      })

    supabase.from('room_types').select('id, name, price_single, price_double, price_fixed, max_occupancy')
      .then(({ data, error }) => {
        if (error) console.error('[Modal] room_types:', error.message)
        else setRoomTypes(data || [])
      })
  }, [])

  const handleGuestChange = (e) => setGuest((g) => ({ ...g, [e.target.name]: e.target.value }))
  const handleResChange   = (e) => setRes((r)   => ({ ...r, [e.target.name]: e.target.value }))

  const availableRooms = rooms.filter((r) => {
    if (r.is_occupied) return false
    return true
  })

  const getSelectedRoomType = () => {
    const roomId = preselectedRoom ? preselectedRoom.id : res.room_id
    const room = preselectedRoom || rooms.find((r) => String(r.id) === String(roomId))
    if (!room) return null
    return roomTypes.find((rt) => rt.name === room.room_type)
  }

  const maxGuests = getSelectedRoomType()?.max_occupancy || 10

  const calcPrice = () => {
    if (!res.check_in || !res.check_out) return 0
    const rt = getSelectedRoomType()
    if (!rt) return 0
    const days = Math.max(1, (new Date(res.check_out) - new Date(res.check_in)) / 86400000)
    const perNight = rt.price_fixed ? rt.price_fixed : (Number(res.num_guests) >= 2 ? rt.price_double : rt.price_single)
    return days * (perNight || 0)
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      // 1. Buscar o crear huésped
      const { data: existing } = await supabase
        .from('guests')
        .select('id')
        .eq('document_type_id', guest.document_type_id)
        .eq('document_number', guest.document_number)
        .maybeSingle()

      let guestId = existing?.id
      if (!guestId) {
        const { data: newGuest, error: gErr } = await supabase
          .from('guests')
          .insert({ ...guest, document_type_id: Number(guest.document_type_id) })
          .select('id')
          .single()
        if (gErr) throw new Error('Error al registrar huésped: ' + gErr.message)
        guestId = newGuest.id
      }

      // 2. Verificar disponibilidad
      const { data: avail } = await supabase.rpc('is_room_available', {
        p_room_id:   Number(res.room_id),
        p_check_in:  res.check_in,
        p_check_out: res.check_out,
      })
      if (!avail) throw new Error('La habitación ya tiene una reserva en esas fechas.')

      // 3. Crear reserva
      const { error: rErr } = await supabase.from('reservations').insert({
        guest_id:    guestId,
        room_id:     Number(res.room_id),
        status_id:   statusId,
        created_by:  staffId,
        check_in:    res.check_in,
        check_out:   res.check_out,
        num_guests:  Number(res.num_guests),
        total_price: calcPrice(),
        source:      'presencial',
        notes:       res.notes || null,
      })
      if (rErr) throw new Error('Error al crear reserva: ' + rErr.message)

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Nueva Reserva</h2>
            <p className="modal-sub">Registro presencial</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Steps */}
        <div className="modal-steps">
          <div className={`mstep ${step >= 1 ? 'active' : ''}`}>
            <span className="mstep-num">1</span>
            <span className="mstep-label">Huésped</span>
          </div>
          <div className="mstep-line" />
          <div className={`mstep ${step >= 2 ? 'active' : ''}`}>
            <span className="mstep-num">2</span>
            <span className="mstep-label">Reserva</span>
          </div>
        </div>

        <div className="modal-body">
          {/* Step 1: Guest */}
          {step === 1 && (
            <div className="modal-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Nombre</label>
                  <input name="first_name" value={guest.first_name} onChange={handleGuestChange} placeholder="Nombre" required />
                </div>
                <div className="form-field">
                  <label>Apellido</label>
                  <input name="last_name" value={guest.last_name} onChange={handleGuestChange} placeholder="Apellido" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Tipo de documento</label>
                  <select name="document_type_id" value={guest.document_type_id} onChange={handleGuestChange} required>
                    <option value="">Seleccionar...</option>
                    {docTypes.map((d) => (
                      <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Número de documento</label>
                  <input name="document_number" value={guest.document_number} onChange={handleGuestChange} placeholder="Ej: 1234567890" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Teléfono</label>
                  <input name="phone" value={guest.phone} onChange={handleGuestChange} placeholder="Ej: 3001234567" />
                </div>
                <div className="form-field">
                  <label>Correo electrónico</label>
                  <input name="email" type="email" value={guest.email} onChange={handleGuestChange} placeholder="correo@ejemplo.com" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Reservation */}
          {step === 2 && (
            <div className="modal-form">
              {preselectedRoom ? (
                <div className="form-field">
                  <label>Habitación</label>
                  <div className="preselected-room">
                    <span className="material-icons">meeting_room</span>
                    #{preselectedRoom.room_number} — {preselectedRoom.room_type} (Piso {preselectedRoom.floor})
                  </div>
                </div>
              ) : (
                <div className="form-field">
                  <label>Habitación</label>
                  <select name="room_id" value={res.room_id} onChange={handleResChange} required>
                    <option value="">Seleccionar habitación...</option>
                    {availableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        #{r.room_number} — {r.room_type} (Piso {r.floor})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-row">
                <div className="form-field">
                  <label>Check-in</label>
                  <input name="check_in" type="date" value={res.check_in} onChange={handleResChange}
                    min={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-field">
                  <label>Check-out</label>
                  <input name="check_out" type="date" value={res.check_out} onChange={handleResChange}
                    min={res.check_in || new Date().toISOString().split('T')[0]} required />
                </div>
              </div>
              <div className="form-field">
                <label>Número de personas (máx. {maxGuests})</label>
                <input name="num_guests" type="number" min="1" max={maxGuests}
                  value={res.num_guests} onChange={(e) => {
                    const v = Math.min(Number(e.target.value), maxGuests)
                    setRes((r) => ({ ...r, num_guests: v }))
                  }} required />
              </div>
              <div className="form-field">
                <label>Notas adicionales</label>
                <textarea name="notes" value={res.notes} onChange={handleResChange}
                  placeholder="Observaciones, solicitudes especiales..." rows={3} />
              </div>

              {calcPrice() > 0 && (
                <div className="res-summary">
                  <span className="material-icons">payments</span>
                  <strong>Total: ${calcPrice().toLocaleString('es-CO')}</strong>
                  {' '}({Math.max(1, (new Date(res.check_out) - new Date(res.check_in)) / 86400000)} noche{Math.max(1, (new Date(res.check_out) - new Date(res.check_in)) / 86400000) !== 1 ? 's' : ''})
                </div>
              )}
              {!calcPrice() && (
                <div className="res-summary">
                  <span className="material-icons">info</span>
                  Selecciona habitación, fechas y personas para ver el precio.
                </div>
              )}
            </div>
          )}

          {error && <p className="modal-error">{error}</p>}
        </div>

        <div className="modal-footer">
          {step === 1 ? (
            <>
              <button className="btn-modal-sec" onClick={onClose}>Cancelar</button>
              <button className="btn-modal-pri"
                disabled={!guest.first_name || !guest.last_name || !guest.document_type_id || !guest.document_number}
                onClick={() => setStep(2)}>
                Siguiente <span className="material-icons">arrow_forward</span>
              </button>
            </>
          ) : (
            <>
              <button className="btn-modal-sec" onClick={() => setStep(1)}>
                <span className="material-icons">arrow_back</span> Atrás
              </button>
              <button className="btn-modal-pri"
                disabled={!res.room_id || !res.check_in || !res.check_out || loading}
                onClick={handleSubmit}>
                {loading ? 'Guardando...' : 'Confirmar Reserva'}
                {!loading && <span className="material-icons">check</span>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewReservationModal
