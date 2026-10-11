import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const vehicleImage = "/images/Captura%20de%20pantalla%202026-10-11%20170017.jpg";

export default function HomePage() {
  return (
    <main className="rentar-home">
      <section className="rentar-home-hero" style={{ backgroundImage: `linear-gradient(90deg, rgb(13 22 25 / 76%) 0%, rgb(13 22 25 / 42%) 48%, rgb(13 22 25 / 8%) 100%), url(\"${vehicleImage}\")` }}>
        <header className="rentar-home-nav">
          <Link href="/" aria-label="Rentar, inicio"><BrandMark /></Link>
          <nav aria-label="Navegación principal">
            <a href="#experiencia">Experiencia</a>
            <Link href="/login">Iniciar sesión</Link>
            <Link className="rentar-home-nav-cta" href="/registro">Crear cuenta <span aria-hidden="true">↗</span></Link>
          </nav>
        </header>

        <div className="rentar-home-copy">
          <p className="rentar-home-eyebrow">ALQUILER DE VEHÍCULOS · BUENOS AIRES</p>
          <h1>El camino<br />empieza con vos.</h1>
          <p className="rentar-home-intro">Encontrá el vehículo para tu próximo viaje. Elegí las fechas, compará opciones y salí a tu ritmo.</p>
          <div className="rentar-home-actions">
            <Link className="rentar-home-primary" href="/cliente">Explorar vehículos <span aria-hidden="true">↗</span></Link>
            <Link className="rentar-home-secondary" href="/registro">Crear mi cuenta</Link>
          </div>
        </div>

        <div className="rentar-home-image-caption">
          <span>Tu próximo destino, a tu manera.</span>
          <span>01 / RENTAR MOVILIDAD</span>
        </div>
      </section>

      <section className="rentar-home-next" id="experiencia">
        <div>
          <p className="rentar-home-eyebrow">MOVERSE MEJOR</p>
          <h2>Un auto para cada plan.</h2>
        </div>
        <p>Desde una escapada de fin de semana hasta los viajes de todos los días: empezá por encontrar el que va con vos.</p>
        <Link href="/cliente">Buscar disponibilidad <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
