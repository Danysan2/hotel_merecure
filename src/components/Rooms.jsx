import React, { useState } from 'react';
import './Rooms.css';

const slides = [
  {
    img: '/hotel_vista_habitacion_doble.jpeg',
    tag: 'HABITACIÓN DOBLE',
    title: 'Habitación Doble',
    price: 'Consultar',
    desc: 'Cómoda habitación doble con todo lo necesario para una estadía perfecta.',
    amenities: [
      { icon: 'bed', label: 'Cama Doble' },
      { icon: 'square_foot', label: '35 m²' },
      { icon: 'wifi', label: 'Wi-Fi Gratis' },
    ],
  },
  {
    img: '/hotel_vista_habitacion_doble1.jpeg',
    tag: 'HABITACIÓN DOBLE',
    title: 'Habitación Doble Premium',
    price: 'Consultar',
    desc: 'Versión premium de nuestra habitación doble con acabados especiales.',
    amenities: [
      { icon: 'bed', label: 'Cama Doble' },
      { icon: 'square_foot', label: '40 m²' },
      { icon: 'wifi', label: 'Wi-Fi Gratis' },
    ],
  },
  {
    img: '/hotel_vista_habitacion_familar.jpeg',
    tag: 'FAMILIAR',
    title: 'Habitación Familiar',
    price: 'Consultar',
    desc: 'Espaciosa habitación diseñada para familias, con todo el confort que necesitan.',
    amenities: [
      { icon: 'king_bed', label: 'Múltiples Camas' },
      { icon: 'square_foot', label: '55 m²' },
      { icon: 'wifi', label: 'Wi-Fi Gratis' },
    ],
  },
  {
    img: '/hotel_vista_habitacion_familiar.jpeg',
    tag: 'FAMILIAR',
    title: 'Habitación Familiar',
    price: 'Consultar',
    desc: 'Suite amplia para toda la familia con áreas separadas para mayor comodidad.',
    amenities: [
      { icon: 'king_bed', label: 'Múltiples Camas' },
      { icon: 'square_foot', label: '65 m²' },
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
              Ingresa al lujo con una habitación diseñada para tu estilo y comodidad.
              Desde interiores elegantes hasta amenidades de primer nivel, nuestros espacios están hechos para tu descanso.
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
