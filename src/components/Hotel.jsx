import React from 'react';
import './Hotel.css';

const Hotel = () => {
  const facilities = [
    {
      image: '/hotel_vista_habitacion_doble1.jpeg',
      title: 'Habitaciones de Calidad',
      description: 'Disfruta habitaciones amplias y bien equipadas diseñadas para el máximo confort y descanso.'
    },
    {
      image: '/hotel_logo.jpeg',
      title: 'Restaurante Gourmet',
      description: 'Cada noche abrimos nuestro restaurante con platos preparados con ingredientes frescos de la región llanera.'
    },
    {
      image: '/hotel_vista_afuera.jpeg',
      title: 'El mejor hotel de Cravo Norte',
      description: 'Somos el referente de hospedaje en Cravo Norte, Arauca. Comodidad, atención personalizada y la calidez de los llanos en un solo lugar.'
    }
  ];

  return (
    <section id="facility" className="section hotel-facilities">
      <div className="container">
        <div className="section-header align-center">
          <span className="section-label animate-on-scroll">El Hotel</span>
          <h2 className="section-title animate-on-scroll">Instalaciones y Servicios</h2>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hotel;
