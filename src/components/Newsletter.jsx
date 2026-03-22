import React from 'react';
import './Newsletter.css';

const Newsletter = () => {
  return (
    <section className="section newsletter">
      <div className="container newsletter-container animate-on-scroll">
        <div className="location-left">
          <span className="section-label">Ubicación</span>
          <h2 className="section-title">¿Dónde estamos?</h2>
          <p className="location-address">
            <span className="material-icons">location_on</span>
            Calle 2 #2-32, Cravo Norte, Arauca, Colombia
          </p>
          <p className="location-desc">
            Encuéntranos en el corazón de Cravo Norte, un destino único rodeado de naturaleza, llanuras y el río Casanare.
          </p>
        </div>
        <div className="map-wrapper">
          <iframe
            title="Ubicación Hotel"
            src="https://maps.google.com/maps?q=Calle+2+%232-32,+Cravo+Norte,+Arauca,+Colombia&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
