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
    <>
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-container">

          {/* Logo */}
          <div className="navbar-logo">
            <img src="/logo_final.png" alt="Hotel Merecure" className="navbar-logo-img" />
            <div className="navbar-logo-text">
              <span className="logo-text">HOTEL</span>
              <span className="logo-subtext">MERECURE</span>
            </div>
          </div>

          {/* Desktop links */}
          <div className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)}>Inicio</a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>Nosotros</a>
            <a href="#facility" onClick={() => setIsMobileMenuOpen(false)}>Servicios</a>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contacto</a>

            {/* Inside slide-in menu on mobile */}
            <div className="mobile-menu-ctas">
              <a href="/reservar" className="btn btn-gold" onClick={() => setIsMobileMenuOpen(false)}>
                Reservar ahora
              </a>
              <a href="/admin" className="btn btn-login-menu" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="material-icons">person</span>
                Login admin
              </a>
            </div>
          </div>

          {/* Desktop CTA buttons */}
          <div className="navbar-cta-group desktop-only">
            <a href="/reservar" className="btn btn-gold">Reservar ahora</a>
            <a href="/admin" className="btn btn-login">
              <span className="material-icons">person</span>
              Login
            </a>
          </div>

          {/* Mobile right side: compact black pill + hamburger */}
          <div className="mobile-right">
            <a href="/reservar" className="mobile-reservar-btn">
              Reservar
            </a>
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

        </div>
      </nav>
    </>
  );
};

export default Navbar;
