import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { publicApi } from '../lib/api';
import './ReservarPage.css';

const HOTEL_WHATSAPP_NUMBER = '573176980346';

// ── Validación de campos ─────────────────────────────────────
const validate = ({ firstName, lastName, docNumber, phone, email }) => {
  if (firstName.trim().length < 2)  return 'El nombre debe tener al menos 2 caracteres.';
  if (lastName.trim().length < 2)   return 'El apellido debe tener al menos 2 caracteres.';
  if (!/^\d{5,15}$/.test(docNumber.trim())) return 'El número de documento debe tener entre 5 y 15 dígitos.';
  const phoneClean = phone.replace(/[\s\-]/g, '');
  if (!/^3\d{9}$/.test(phoneClean)) return 'El celular debe ser un número colombiano válido (ej: 3001234567).';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'El correo no tiene un formato válido.';
  return null;
};

const toISO  = (d) => d ? (typeof d === 'string' ? d : d.toISOString().split('T')[0]) : '';
const fromISO = (s) => s ? new Date(s + 'T00:00:00') : undefined;
const fmtDate = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const money = (value) => Number(value || 0).toLocaleString('es-CO');

const buildWhatsAppMessage = ({
  firstName,
  lastName,
  docTypeName,
  docNumber,
  phone,
  email,
  roomTypeName,
  checkIn,
  checkOut,
  guests,
  nights,
  pricePerNight,
  totalPrice,
}) => {
  const lines = [
    'Hola, quiero consultar disponibilidad para una reserva en Hotel Merecure.',
    '',
    'Datos del huésped:',
    `Nombre: ${firstName.trim()} ${lastName.trim()}`,
    `Documento: ${docTypeName || 'No especificado'} ${docNumber.trim()}`,
    `Celular: ${phone.replace(/[\s\-]/g, '')}`,
  ];

  if (email.trim()) lines.push(`Correo: ${email.trim()}`);

  lines.push(
    '',
    'Detalle de la estadía:',
    `Habitación: ${roomTypeName}`,
    `Llegada: ${fmtDate(checkIn)} (${checkIn})`,
    `Salida: ${fmtDate(checkOut)} (${checkOut})`,
    `Personas: ${guests}`,
    `Noches: ${nights}`,
  );

  if (totalPrice > 0) {
    lines.push(
      `Valor estimado: $${money(totalPrice)}`,
      `Tarifa usada: $${money(pricePerNight)} por noche`,
    );
  }

  lines.push('', 'Quedo atento(a) para confirmar si hay disponibilidad.');

  return lines.join('\n');
};

export default function ReservarPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const [roomTypes, setRoomTypes] = useState([]);
  const [docTypes,  setDocTypes]  = useState([]);
  const [showCal,     setShowCal]     = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loadError,   setLoadError]   = useState('');

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
    const loadData = async () => {
      try {
        const [roomTypeRows, documentTypeRows] = await Promise.all([
          publicApi.getRoomTypes(),
          publicApi.getDocumentTypes(),
        ]);
        setRoomTypes(roomTypeRows || []);
        setDocTypes(documentTypeRows || []);
      } catch (err) {
        console.error('[ReservarPage] Error al cargar datos:', err);
        setLoadError('Error al cargar el formulario. Recarga la página o contáctanos al +57 317 698 0346.');
      }
    };
    loadData();
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!roomTypeId || !range.from || !range.to) {
      setSubmitError('Selecciona el tipo de habitación y las fechas de llegada y salida.');
      return;
    }

    const validationError = validate({ firstName, lastName, docNumber, phone, email });
    if (validationError) { setSubmitError(validationError); return; }

    setSubmitError('');
    const checkIn  = toISO(range.from);
    const checkOut = toISO(range.to);
    const selectedDocType = docTypes.find(d => String(d.id) === String(docTypeId));
    const docTypeName = selectedDocType ? `${selectedDocType.code} - ${selectedDocType.name}` : '';
    const message = buildWhatsAppMessage({
      firstName,
      lastName,
      docTypeName,
      docNumber,
      phone,
      email,
      roomTypeName,
      checkIn,
      checkOut,
      guests,
      nights,
      pricePerNight,
      totalPrice,
    });
    const whatsappUrl = `https://wa.me/${HOTEL_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    window.location.href = whatsappUrl;
  };

  return (
    <div className="reservar-page">
      {/* Header */}
      <div className="reservar-hero">
        <button className="reservar-back" onClick={() => navigate('/')}>
          <span className="material-icons">arrow_back</span> Volver
        </button>
        <div className="reservar-hero-text">
          <span className="reservar-label">Solicitud de reserva</span>
          <h1 className="reservar-title">Consulta disponibilidad</h1>
          <p className="reservar-sub">Envía tus datos por WhatsApp para que recepción confirme disponibilidad</p>
        </div>
      </div>

      <div className="reservar-body">
        {loadError && (
          <div className="reservar-error" style={{ margin: '1.5rem auto', maxWidth: '600px' }}>
            <span className="material-icons">cloud_off</span>
            <span>{loadError}</span>
          </div>
        )}
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

          <button type="submit" className="reservar-submit">
            <span className="material-icons">chat</span> Enviar solicitud por WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
