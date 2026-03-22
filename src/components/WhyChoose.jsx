import React from 'react';
import './WhyChoose.css';

const WhyChoose = () => {
  const features = [
    {
      icon: 'event_available',
      title: 'Cancelación Fácil',
      description: 'Disfruta la flexibilidad de cancelaciones sin complicaciones, dándote tranquilidad ante cualquier cambio.'
    },
    {
      icon: 'star',
      title: 'Ofertas Exclusivas',
      description: 'Accede a descuentos especiales y promociones solo para miembros para una experiencia de lujo al mejor precio.'
    },
    {
      icon: 'pool',
      title: 'Amenidades Premium',
      description: 'Vive instalaciones de clase mundial incluyendo Wi-Fi de alta velocidad, ropa de cama premium y gimnasio.'
    },
    {
      icon: 'support_agent',
      title: 'Soporte 24/7',
      description: 'Nuestro equipo de atención está disponible las 24 horas para garantizarte una estadía perfecta.'
    }
  ];

  return (
    <section id="about" className="section why-choose">
      <div className="container">
        <div className="why-choose-grid">
          <div className="why-choose-info">
            <span className="section-label animate-on-scroll">Por Qué Elegirnos</span>
            <h2 className="section-title animate-on-scroll">El hotel con los mejores servicios y calidad.</h2>
            <p className="section-subtitle animate-on-scroll">
              Enclavado en el vibrante pulso de las maravillas naturales de Colombia, ofrecemos un santuario
              donde el mundo botánico se une al lujo refinado y al servicio excepcional.
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
