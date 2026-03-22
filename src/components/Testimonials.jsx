import React from 'react';
import './Testimonials.css';

const Testimonials = () => {
  const reviews = [
    {
      name: 'Sophia K.',
      role: 'Huésped Frecuente',
      text: 'Desde el momento en que llegamos, todo fue impecable. El servicio al cliente fue excelente y las ofertas exclusivas hicieron nuestra estadía aún mejor.',
      rating: 5
    },
    {
      name: 'James B.',
      role: 'Viajero de Negocios',
      text: 'Este hotel redefine el confort y el lujo. La atención al detalle, las amenidades de primer nivel y el personal amable hicieron nuestro viaje inolvidable.',
      rating: 5
    },
    {
      name: 'Ahmed H.',
      role: 'Vacaciones en Familia',
      text: '¡Una experiencia cinco estrellas! Los tratamientos de spa fueron maravillosos, la comida deliciosa y el ambiente pura felicidad. ¡Altamente recomendado!',
      rating: 5
    }
  ];

  return (
    <section className="section testimonials">
      <div className="container">
        <div className="section-header align-center">
          <span className="section-label animate-on-scroll">Testimonios</span>
          <h2 className="section-title animate-on-scroll">Lo Que Dicen Nuestros Clientes</h2>
        </div>
        
        <div className="testimonials-grid">
          {reviews.map((rev, index) => (
            <div 
              key={index} 
              className="testimonial-card animate-on-scroll"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="quote-icon">
                <span className="material-icons">format_quote</span>
              </div>
              <div className="stars">
                {[...Array(rev.rating)].map((_, i) => (
                  <span key={i} className="material-icons star">star</span>
                ))}
              </div>
              <p className="testimonial-text">"{rev.text}"</p>
              <div className="testimonial-author">
                <div className="author-info">
                  <h4 className="author-name">{rev.name}</h4>
                  <span className="author-role">{rev.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
