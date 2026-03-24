import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import './BookingBar.css';
import { supabase } from '../lib/supabase';

const formatDate = (date) => {
  if (!date) return null;
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toISODate = (date) => {
  if (!date) return null;
  return date.toISOString().split('T')[0];
};

const BookingBar = () => {
  const navigate = useNavigate();
  const [roomTypes, setRoomTypes]   = useState([]);
  const [roomType, setRoomType]     = useState('');
  const [guests, setGuests]         = useState(1);
  const [range, setRange]           = useState({ from: undefined, to: undefined });
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading]       = useState(false);
  const calendarRef = useRef(null);

  // Cargar tipos de habitación desde Supabase
  useEffect(() => {
    supabase
      .from('room_types')
      .select('id, name, max_occupancy')
      .then(({ data }) => {
        if (data) setRoomTypes(data);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    const selectedRoom = roomTypes.find((r) => String(r.id) === roomType);
    navigate('/reservar', {
      state: {
        roomTypeId:   selectedRoom?.id   || null,
        roomTypeName: selectedRoom?.name || '',
        checkIn:      toISODate(range.from),
        checkOut:     toISODate(range.to),
        guests,
      }
    });
  };

  return (
    <div className="booking-bar-wrapper">
      <div className="booking-bar">

        {/* Tipo de habitación */}
        <div className="booking-field">
          <span className="booking-label">Tipo de Habitación</span>
          <div className="booking-input-wrap">
            <span className="material-icons booking-icon">king_bed</span>
            <select value={roomType} onChange={(e) => {
              setRoomType(e.target.value);
              const sel = roomTypes.find((r) => String(r.id) === e.target.value);
              if (sel && guests > sel.max_occupancy) setGuests(sel.max_occupancy);
            }}>
              <option value="">Seleccionar...</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={String(rt.id)}>{rt.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="booking-divider" />

        {/* Fechas */}
        <div className="booking-field booking-field--dates" ref={calendarRef}>
          <div className="booking-dates-row" onClick={() => setShowCalendar((v) => !v)}>
            <div className="booking-date-block">
              <span className="booking-label">Llegada</span>
              <div className="booking-input-wrap">
                <span className="material-icons booking-icon">calendar_today</span>
                <span className="booking-date-value">
                  {range.from ? formatDate(range.from) : 'DD / MM / AAAA'}
                </span>
              </div>
            </div>

            <div className="booking-arrow">
              <span className="material-icons">arrow_forward</span>
            </div>

            <div className="booking-date-block">
              <span className="booking-label">Salida</span>
              <div className="booking-input-wrap">
                <span className="material-icons booking-icon">calendar_today</span>
                <span className="booking-date-value">
                  {range.to ? formatDate(range.to) : 'DD / MM / AAAA'}
                </span>
              </div>
            </div>
          </div>

          {showCalendar && (
            <div className="booking-calendar-popup">
              <DayPicker
                locale={es}
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={1}
                disabled={{ before: new Date() }}
                showOutsideDays
              />
            </div>
          )}
        </div>

        <div className="booking-divider" />

        {/* Personas */}
        <div className="booking-field">
          <span className="booking-label">Personas</span>
          <div className="booking-input-wrap">
            <span className="material-icons booking-icon">group</span>
            <div className="guests-control">
              <button onClick={() => setGuests((g) => Math.max(1, g - 1))}>−</button>
              <span>{guests}</span>
              <button onClick={() => {
                const sel = roomTypes.find((r) => String(r.id) === roomType);
                const max = sel?.max_occupancy || 10;
                setGuests((g) => Math.min(max, g + 1));
              }}>+</button>
            </div>
          </div>
        </div>

        <button className="booking-btn" onClick={handleSearch} disabled={loading}>
          <span className="material-icons">{loading ? 'hourglass_empty' : 'search'}</span>
        </button>
      </div>
    </div>
  );
};

export default BookingBar;
