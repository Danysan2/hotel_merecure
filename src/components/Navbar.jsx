import React, { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <div className="navbar-logo">
          <span className="logo-text">HOTEL</span>
          <span className="logo-subtext">MERECURE</span>
        </div>

        <div className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <a href="#home" onClick={() => setIsMobileMenuOpen(false)}>Inicio</a>
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>Nosotros</a>
          <a href="#services" onClick={() => setIsMobileMenuOpen(false)}>Servicios</a>
          <a href="#facility" onClick={() => setIsMobileMenuOpen(false)}>Instalaciones</a>
          <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contacto</a>
        </div>

        <div className="navbar-cta-group">
          <a href="/reservar" className="btn btn-gold desktop-cta">Reservar ahora</a>
          <a href="/admin" className="btn btn-login desktop-cta">
            <span className="material-icons">person</span>
            Login
          </a>
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="material-icons">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
