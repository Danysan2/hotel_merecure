import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="navbar-logo">
              <span className="logo-text">MERECURE</span>
              <span className="logo-subtext">HOTEL</span>
            </div>
            <p className="footer-about">
              Una mezcla de lujo, confort y servicio de clase mundial enclavada en el radiante paisaje botánico de Cartagena.
            </p>
          </div>
          
          <div className="footer-links-grid">
            <div className="footer-group">
              <h4>Enlaces Rápidos</h4>
              <ul>
                <li><a href="#home">Inicio</a></li>
                <li><a href="#about">Nosotros</a></li>
                <li><a href="#rooms">Habitaciones</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#contact">Contacto</a></li>
              </ul>
            </div>
            
            <div className="footer-group">
              <h4>Servicios</h4>
              <ul>
                <li><a href="#">Habitaciones</a></li>
                <li><a href="#">Amenidades</a></li>
                <li><a href="#">Spa & Bienestar</a></li>
                <li><a href="#">Experiencias Gastronómicas</a></li>
                <li><a href="#">Espacios para Eventos</a></li>
              </ul>
            </div>
            
            <div className="footer-group">
              <h4>Contacto</h4>
              <ul className="contact-list">
                <li>
                  <span className="material-icons">location_on</span>
                  <span>123 Botanical Ave. Cartagena, CO</span>
                </li>
                <li>
                  <span className="material-icons">phone</span>
                  <span>+57 1 800 234 567</span>
                </li>
                <li>
                  <span className="material-icons">email</span>
                  <span>welcome@merecurehotel.co</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2024 Hotel Merecure. Todos los derechos reservados.</p>
          <div className="footer-legal">
            <a href="#">Política de Privacidad</a>
            <a href="#">Términos de Servicio</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
