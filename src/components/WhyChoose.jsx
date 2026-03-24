import React from 'react';
import './WhyChoose.css';

const WhyChoose = () => {
  const features = [
    {
      icon: 'wifi',
      title: 'Wi-Fi Gratis',
      description: 'Conexión a internet en todas las habitaciones y áreas comunes para que estés siempre conectado.'
    },
    {
      icon: 'shower',
      title: 'Baño Privado',
      description: 'Todas nuestras habitaciones cuentan con baño privado, aire acondicionado o ventilador para tu comodidad.'
    },
    {
      icon: 'restaurant',
      title: 'Restaurante Gourmet',
      description: 'Disfruta de nuestra cocina llanera con platos preparados con ingredientes frescos de la región, servicio por las noches.'
    },
    {
      icon: 'local_laundry_service',
      title: 'Lavandería',
      description: 'Servicio de lavandería disponible para que tu estadía sea lo más cómoda posible.'
    }
  ];

  return (
    <section id="about" className="section why-choose">
      <div className="container">
        <div className="why-choose-grid">
          <div className="why-choose-info">
            <span className="section-label animate-on-scroll">Por Qué Elegirnos</span>
            <h2 className="section-title animate-on-scroll">Un lugar para descansar con atención de calidad.</h2>
            <p className="section-subtitle animate-on-scroll">
              En el corazón de Cravo Norte, ofrecemos un espacio cómodo y tranquilo para quienes buscan descansar y desconectarse del ruido de la ciudad.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card animate-on-scroll"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="feature-icon">
                  <span className="material-icons">{feature.icon}</span>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-text">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
