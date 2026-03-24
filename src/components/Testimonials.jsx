import React from 'react';
import './Testimonials.css';

const Testimonials = () => {
  const reviews = [
    {
      name: 'Iván González',
      role: 'Viajero de Negocios',
      text: 'Me hospedé por trabajo y la verdad superó mis expectativas. El personal muy amable, siempre dispuesto a ayudar. El hotel es tranquilo y las habitaciones muy limpias. Volvería sin dudarlo.',
      rating: 5
    },
    {
      name: 'Juan Cepeda',
      role: 'Huésped',
      text: 'Lo que más me gustó fue el restaurante en la noche, una sorpresa muy agradable. La comida estuvo deliciosa y el ambiente muy acogedor. La hospitalidad del equipo se nota desde que uno llega.',
      rating: 5
    },
    {
      name: 'Jenny Flórez',
      role: 'Visita Familiar',
      text: 'Vinimos en familia y todos quedamos muy contentos. El hotel es limpio, tranquilo y la gente muy cálida. Se nota que le ponen mucho cariño a la atención. Lo recomiendo a quien visite Cravo Norte.',
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
