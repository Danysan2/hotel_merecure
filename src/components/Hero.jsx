import './Hero.jsx.css';
import BookingBar from './BookingBar';

const Hero = () => {
  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/video_hotel.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
      </div>

      <div className="container hero-container">
        <div className="hero-content">
          <span className="section-label animate-on-scroll">Bienvenido a Merecure</span>
          <h1 className="hero-title animate-on-scroll">
            Descubre el Lujo Como Nunca <br /> Antes en Hotel Merecure
          </h1>
        </div>
      </div>

      <div className="hero-booking">
        <BookingBar />
      </div>
    </section>
  );
};

export default Hero;
