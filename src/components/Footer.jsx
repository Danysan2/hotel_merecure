import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="navbar-logo">
              <span className="logo-text">HOTEL</span>
              <span className="logo-subtext">MERECURE</span>
            </div>
            <p className="footer-about">
              Tu lugar para descansar en Cravo Norte. Atención cercana, comodidad y tranquilidad en el corazón de los llanos.
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
                <li><a href="#">Wi-Fi Gratis</a></li>
                <li><a href="#">Aire Acondicionado</a></li>
                <li><a href="#">Restaurante</a></li>
                <li><a href="#">Lavandería</a></li>
              </ul>
            </div>
            
            <div className="footer-group">
              <h4>Contacto</h4>
              <ul className="contact-list">
                <li>
                  <span className="material-icons">location_on</span>
                  <span>Calle 2 #2-32, Cravo Norte, Arauca</span>
                </li>
                <li>
                  <span className="material-icons">phone</span>
                  <span>+57 317 698 0346</span>
                </li>
                <li>
                  <span className="material-icons">email</span>
                  <span>hotelmerecurecravonorte@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2026 Hotel Merecure. Todos los derechos reservados.</p>
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
