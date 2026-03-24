import React, { useState } from 'react';
import './Rooms.css';

const slides = [
  {
    img: '/hotel_vista_habitacion_doble.jpeg',
    tag: 'DOBLE VENTILADOR',
    title: 'Habitación Doble',
    price: 'Desde $40.000',
    desc: 'Cama doble con ventilador. Ideal para una persona o pareja que busca comodidad a buen precio.',
    amenities: [
      { icon: 'bed', label: 'Cama Doble' },
      { icon: 'wifi', label: 'Wi-Fi Gratis' },
      { icon: 'shower', label: 'Baño Privado' },
    ],
  },
  {
    img: '/hotel_vista_habitacion_doble1.jpeg',
    tag: 'DOBLE A/C',
    title: 'Habitación Doble A/C',
    price: 'Desde $60.000',
    desc: 'Cama doble con aire acondicionado. La más popular del hotel, perfecta para descansar del calor llanero.',
    amenities: [
      { icon: 'bed', label: 'Cama Doble' },
      { icon: 'ac_unit', label: 'Aire Acondicionado' },
      { icon: 'wifi', label: 'Wi-Fi Gratis' },
    ],
  },
  {
    img: '/hotel_vista_habitacion_familar.jpeg',
    tag: 'TRIPLE',
    title: 'Habitación Triple',
    price: 'Desde $70.000',
    desc: 'Habitación con 3 camas, ideal para grupos de trabajo o amigos. Disponible con ventilador o A/C.',
    amenities: [
      { icon: 'king_bed', label: '3 Camas' },
      { icon: 'wifi', label: 'Wi-Fi Gratis' },
      { icon: 'shower', label: 'Baño Privado' },
    ],
  },
  {
    img: '/hotel_vista_habitacion_familiar.jpeg',
    tag: 'FAMILIAR',
    title: 'Habitación Familiar (5 camas)',
    price: '$150.000 / noche',
    desc: 'Cama doble y dos camarotes con aire acondicionado. Perfecta para familias o grupos grandes.',
    amenities: [
      { icon: 'king_bed', label: '5 Camas' },
      { icon: 'ac_unit', label: 'Aire Acondicionado' },
      { icon: 'wifi', label: 'Wi-Fi Gratis' },
    ],
  },
];

const Rooms = () => {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  const slide = slides[current];

  return (
    <section id="rooms" className="section rooms">
      <div className="container">
        <div className="rooms-content">
          <div className="rooms-info">
            <span className="section-label animate-on-scroll">Alojamiento</span>
            <h2 className="section-title animate-on-scroll">¡La mejor habitación solo para ti!</h2>
            <p className="section-subtitle animate-on-scroll">
              22 habitaciones distribuidas en 2 pisos, con ventilador o aire acondicionado.
              Desde habitaciones dobles hasta familiares con capacidad para 5 personas.
            </p>
            <div className="rooms-actions animate-on-scroll">
              <button className="btn btn-primary">Ver Todas las Habitaciones</button>
            </div>
          </div>

          <div className="rooms-featured animate-on-scroll">
            <div className="room-carousel">
              <button className="carousel-btn carousel-btn--prev" onClick={prev} aria-label="Anterior">&#8249;</button>

              <div className="room-card main-room">
                <div className="room-image-wrapper">
                  <img src={slide.img} alt={slide.title} className="room-image" key={current} />
                  <div className="room-tag">{slide.tag}</div>
                  <div className="carousel-dots">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        className={`dot ${i === current ? 'dot--active' : ''}`}
                        onClick={() => setCurrent(i)}
                        aria-label={`Ir a imagen ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="room-details">
                  <div className="room-header">
                    <h3 className="room-title">{slide.title}</h3>
                    <span className="room-price">{slide.price}</span>
                  </div>
                  <p className="room-desc">{slide.desc}</p>
                  <div className="room-amenities">
                    {slide.amenities.map((a, i) => (
                      <span key={i}>
                        <i className="material-icons">{a.icon}</i> {a.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button className="carousel-btn carousel-btn--next" onClick={next} aria-label="Siguiente">&#8250;</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Rooms;
