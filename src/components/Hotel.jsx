import React from 'react';
import './Hotel.css';
import roomImg from '../assets/room-deluxe.png';
import exteriorImg from '../assets/hotel-exterior.png';
import beachImg from '../assets/private-beach.png';

const Hotel = () => {
  const facilities = [
    {
      image: roomImg,
      title: 'Habitaciones de Calidad',
      description: 'Disfruta habitaciones amplias y bien equipadas diseñadas para el máximo confort y descanso.'
    },
    {
      image: beachImg,
      title: 'Playa Privada',
      description: 'Vive el lujo de una playa privada y exclusiva, perfecta para relajarte junto al mar.'
    },
    {
      image: exteriorImg,
      title: 'Mejor Alojamiento',
      description: 'Elige entre una amplia variedad de opciones de alojamiento adaptadas a tus preferencias.'
    }
  ];

  return (
    <section id="facility" className="section hotel-facilities">
      <div className="container">
        <div className="section-header align-center">
          <span className="section-label animate-on-scroll">El Hotel</span>
          <h2 className="section-title animate-on-scroll">Instalaciones y Servicios Premium</h2>
        </div>
        
        <div className="facilities-grid">
          {facilities.map((fac, index) => (
            <div 
              key={index} 
              className="facility-card animate-on-scroll"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="facility-image">
                <img src={fac.image} alt={fac.title} />
              </div>
              <div className="facility-info">
                <h3 className="facility-title">{fac.title}</h3>
                <p className="facility-desc">{fac.description}</p>
                <a href="#" className="read-more">
                  Leer Más <span className="material-icons">arrow_forward</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hotel;
