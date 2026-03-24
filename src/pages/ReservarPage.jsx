import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { supabase } from '../lib/supabase';
import './ReservarPage.css';

const toISO  = (d) => d ? (typeof d === 'string' ? d : d.toISOString().split('T')[0]) : '';
const fromISO = (s) => s ? new Date(s + 'T00:00:00') : undefined;
const fmtDate = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ReservarPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const [roomTypes, setRoomTypes] = useState([]);
  const [docTypes,  setDocTypes]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [showCal,   setShowCal]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Datos de estadia
  const [roomTypeId,   setRoomTypeId]   = useState(state?.roomTypeId   ? String(state.roomTypeId) : '');
  const [roomTypeName, setRoomTypeName] = useState(state?.roomTypeName || '');
  const [guests,       setGuests]       = useState(state?.guests       || 1);
  const [range, setRange] = useState({
    from: fromISO(state?.checkIn),
    to:   fromISO(state?.checkOut),
  });

  // Datos personales
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [docTypeId, setDocTypeId] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');

  useEffect(() => {
    supabase.from('room_types').select('id, name, price_single, price_double, price_fixed, max_occupancy').then(({ data }) => setRoomTypes(data || []));
    supabase.from('document_types').select('id, code, name').then(({ data }) => setDocTypes(data || []));
  }, []);

  const handleRoomType = (id) => {
    setRoomTypeId(id);
    const rt = roomTypes.find(r => String(r.id) === id);
    setRoomTypeName(rt?.name || '');
    if (rt && guests > rt.max_occupancy) setGuests(rt.max_occupancy);
  };

  const selectedRT = roomTypes.find(r => String(r.id) === roomTypeId);
  const maxGuests  = selectedRT?.max_occupancy || 10;

  const nights = range.from && range.to
    ? Math.max(1, Math.round((range.to - range.from) / 86400000))
    : 0;

  const pricePerNight = selectedRT
    ? (selectedRT.price_fixed ? selectedRT.price_fixed : (guests >= 2 ? selectedRT.price_double : selectedRT.price_single))
    : 0;
  const totalPrice = nights * (pricePerNight || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setLoading(true);

    try {
      const checkIn  = toISO(range.from);
      const checkOut = toISO(range.to);

      const { error: insertError } = await supabase.from('booking_requests').insert({
        room_type_id:  roomTypeId ? Number(roomTypeId) : null,
        check_in:      checkIn  || null,
        check_out:     checkOut || null,
        num_guests:    guests,
        contact_name:  `${firstName} ${lastName}`.trim() || null,
        contact_phone: phone  || null,
        contact_email: email  || null,
        whatsapp_sent: false,
      });

      if (insertError) {
        console.error('[ReservarPage] Error al guardar solicitud:', insertError);
        setSubmitError('No pudimos registrar tu solicitud. Por favor intenta de nuevo o contáctanos directamente al +57 317 698 0346.');
        return;
      }

      setShowModal(true);
    } catch (err) {
      console.error('[ReservarPage] Error inesperado:', err);
      setSubmitError('Sin conexión. Verifica tu red e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reservar-page">
      {/* Header */}
      <div className="reservar-hero">
        <button className="reservar-back" onClick={() => navigate('/')}>
          <span className="material-icons">arrow_back</span> Volver
        </button>
        <div className="reservar-hero-text">
          <span className="reservar-label">Reservaciones</span>
          <h1 className="reservar-title">Completa tu reserva</h1>
          <p className="reservar-sub">Llena tus datos y un asesor te contactará para confirmar</p>
        </div>
      </div>

      <div className="reservar-body">
        <form className="reservar-form" onSubmit={handleSubmit}>

          {/* ── Sección 1: Estadia ── */}
          <div className="reservar-section">
            <h2 className="rsec-title">
              <span className="rsec-num">1</span>Detalles de la estadía
            </h2>

            <div className="rform-row">
              <div className="rform-field">
                <label>Tipo de habitación</label>
                <select value={roomTypeId} onChange={e => handleRoomType(e.target.value)} required>
                  <option value="">Seleccionar...</option>
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={String(rt.id)}>{rt.name}</option>
                  ))}
                </select>
              </div>
              <div className="rform-field">
                <label>Número de personas</label>
                <div className="guests-row">
                  <button type="button" className="g-btn" onClick={() => setGuests(g => Math.max(1, g - 1))}>−</button>
                  <span className="g-val">{guests}</span>
                  <button type="button" className="g-btn" onClick={() => setGuests(g => Math.min(maxGuests, g + 1))}>+</button>
                </div>
                {roomTypeId && <span className="max-guests-hint">Máx. {maxGuests} personas</span>}
              </div>
            </div>

            {/* Fechas */}
            <div className="rform-row">
              <div className="rform-field date-field" onClick={() => setShowCal(v => !v)}>
                <label>Llegada</label>
                <div className="rdate-input">
                  <span className="material-icons">calendar_today</span>
                  <span>{range.from ? fmtDate(toISO(range.from)) : 'DD / MM / AAAA'}</span>
                </div>
              </div>
              <div className="rform-field date-field" onClick={() => setShowCal(v => !v)}>
                <label>Salida</label>
                <div className="rdate-input">
                  <span className="material-icons">calendar_today</span>
                  <span>{range.to ? fmtDate(toISO(range.to)) : 'DD / MM / AAAA'}</span>
                </div>
              </div>
            </div>

            {showCal && (
              <div className="rcal-wrapper">
                <DayPicker
                  locale={es} mode="range" selected={range}
                  onSelect={(r) => { setRange(r); if (r?.from && r?.to) setShowCal(false); }}
                  numberOfMonths={1} disabled={{ before: new Date() }} showOutsideDays
                />
              </div>
            )}

            {nights > 0 && (
              <div className="nights-badge">
                <span className="material-icons">nights_stay</span>
                {nights} noche{nights !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* ── Sección 2: Datos personales ── */}
          <div className="reservar-section">
            <h2 className="rsec-title">
              <span className="rsec-num">2</span>Tus datos
            </h2>

            <div className="rform-row">
              <div className="rform-field">
                <label>Nombre <span className="required">*</span></label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nombre" required />
              </div>
              <div className="rform-field">
                <label>Apellido <span className="required">*</span></label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Apellido" required />
              </div>
            </div>

            <div className="rform-row">
              <div className="rform-field">
                <label>Tipo de documento <span className="required">*</span></label>
                <select value={docTypeId} onChange={e => setDocTypeId(e.target.value)} required>
                  <option value="">Seleccionar...</option>
                  {docTypes.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                </select>
              </div>
              <div className="rform-field">
                <label>Número de documento <span className="required">*</span></label>
                <input value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="Ej: 1234567890" required />
              </div>
            </div>

            <div className="rform-row">
              <div className="rform-field">
                <label>Celular <span className="required">*</span></label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej: 3001234567" required />
              </div>
              <div className="rform-field">
                <label>Correo electrónico <span className="optional">(opcional)</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
              </div>
            </div>
          </div>

          {/* Resumen */}
          {roomTypeName && range.from && range.to && (
            <div className="reservar-summary">
              <div className="rs-row">
                <span className="material-icons">king_bed</span>
                <span>{roomTypeName}</span>
              </div>
              <div className="rs-row">
                <span className="material-icons">calendar_today</span>
                <span>{fmtDate(toISO(range.from))} → {fmtDate(toISO(range.to))}</span>
              </div>
              <div className="rs-row">
                <span className="material-icons">group</span>
                <span>{guests} persona{guests !== 1 ? 's' : ''} · {nights} noche{nights !== 1 ? 's' : ''}</span>
              </div>
              {totalPrice > 0 && (
                <div className="rs-row rs-total">
                  <span className="material-icons">payments</span>
                  <span><strong>Total estimado: ${totalPrice.toLocaleString('es-CO')}</strong></span>
                </div>
              )}
              {pricePerNight > 0 && (
                <div className="rs-row rs-detail">
                  <span className="material-icons">info</span>
                  <span>${Number(pricePerNight).toLocaleString('es-CO')} / noche × {nights} noche{nights !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )}

          {submitError && (
            <div className="reservar-error">
              <span className="material-icons">error_outline</span>
              <span>{submitError}</span>
            </div>
          )}

          <button type="submit" className="reservar-submit" disabled={loading}>
            {loading ? 'Enviando...' : (
              <><span className="material-icons">check_circle</span> Reservar</>
            )}
          </button>
        </form>
      </div>

      {/* ── Modal de confirmación ── */}
      {showModal && (
        <div className="res-modal-overlay">
          <div className="res-modal-card">
            <div className="res-modal-icon">
              <span className="material-icons">celebration</span>
            </div>
            <h2>¡Solicitud recibida!</h2>
            <p>
              Un asesor del Hotel Merecure se comunicará contigo próximamente al número <strong>{phone}</strong> para confirmar tu reserva y coordinar el pago del adelanto.
            </p>
            <div className="res-modal-info">
              <span className="material-icons">info</span>
              <span>Revisa también tu correo electrónico si lo proporcionaste.</span>
            </div>
            <button className="res-modal-btn" onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
