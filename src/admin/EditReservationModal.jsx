import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './NewReservationModal.css'

const EditReservationModal = ({ room, onClose, onSuccess }) => {
  const [checkIn,  setCheckIn]  = useState(room.check_in  || '')
  const [checkOut, setCheckOut] = useState(room.check_out || '')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSave = async () => {
    setError('')
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setError('Las fechas no son válidas. La salida debe ser posterior a la llegada.')
      return
    }

    setLoading(true)

    const { data: avail } = await supabase.rpc('is_room_available', {
      p_room_id:            room.id,
      p_check_in:           checkIn,
      p_check_out:          checkOut,
      p_exclude_reservation: room.reservation_id,
    })

    if (!avail) {
      setError('La habitación ya tiene otra reserva en esas fechas.')
      setLoading(false)
      return
    }

    const { error: err } = await supabase
      .from('reservations')
      .update({ check_in: checkIn, check_out: checkOut })
      .eq('id', room.reservation_id)

    setLoading(false)
    if (err) { setError('Error al actualizar: ' + err.message); return }
    onSuccess()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Editar Reserva</h2>
            <p className="modal-sub">Habitación #{room.room_number} · {room.first_name} {room.last_name}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-form">
            <div className="form-row">
              <div className="form-field">
                <label>Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="modal-error">{error}</p>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-modal-sec" onClick={onClose}>Cancelar</button>
          <button
            className="btn-modal-pri"
            onClick={handleSave}
            disabled={loading || !checkIn || !checkOut}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
            {!loading && <span className="material-icons">check</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditReservationModal
