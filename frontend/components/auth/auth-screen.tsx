"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Input } from "@/components/ui/form-controls";

type AuthScreenProps = {
  mode: "login" | "register";
};

export function AuthScreen({ mode }: AuthScreenProps) {
  const isRegister = mode === "register";
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("La autenticación se conectará al servicio en una próxima etapa.");
  }

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Vehículo disponible para alquilar">
        <div className="auth-visual-top">
          <BrandMark />
          <span className="auth-location">BUENOS AIRES · ARG</span>
        </div>
        <div className="auth-visual-copy">
          <p className="auth-kicker">TU PRÓXIMO VIAJE EMPIEZA ACÁ</p>
          <h1>La ruta<br />es tuya.</h1>
          <p>Elegí un auto, marcá el destino y disfrutá el camino.</p>
        </div>
        <div className="auth-visual-caption">
          <span>Rentar movilidad</span>
          <span>01 / 04</span>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-mobile-brand"><BrandMark /></div>
        <div className="auth-form-wrap">
          <p className="auth-eyebrow">{isRegister ? "CREÁ TU CUENTA" : "BIENVENIDO DE VUELTA"}</p>
          <h2>{isRegister ? "Empezá a moverte." : "Tu viaje te espera."}</h2>
          <p className="auth-intro">
            {isRegister
              ? "Un perfil, todos los caminos por descubrir."
              : "Ingresá a tu espacio Rentar y seguí en camino."}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister ? (
              <div className="auth-name-row">
                <Input label="Nombre" name="firstName" autoComplete="given-name" placeholder="Lucía" required />
                <Input label="Apellido" name="lastName" autoComplete="family-name" placeholder="Pérez" required />
              </div>
            ) : null}
            <Input
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nombre@correo.com"
              required
            />
            {isRegister ? (
              <Input label="Teléfono" name="phone" type="tel" autoComplete="tel" placeholder="+54 11 5555 0101" required />
            ) : null}
            <Input
              label="Contraseña"
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="Al menos 8 caracteres"
              minLength={8}
              required
            />
            {isRegister ? (
              <label className="auth-terms">
                <input type="checkbox" required />
                <span>Acepto los términos y condiciones del servicio.</span>
              </label>
            ) : (
              <div className="auth-form-meta">
                <label className="auth-remember"><input type="checkbox" /> Recordarme</label>
                <button type="button" className="auth-text-button" onClick={() => setNotice("La recuperación de contraseña se habilitará junto con la autenticación.")}>¿Olvidaste tu contraseña?</button>
              </div>
            )}
            <button className="auth-submit" type="submit">
              {isRegister ? "Crear cuenta" : "Iniciar sesión"}
              <span aria-hidden="true">↗</span>
            </button>
            {notice ? <p className="auth-notice" role="status">{notice}</p> : null}
          </form>

          <p className="auth-switch">
            {isRegister ? "¿Ya tenés una cuenta?" : "¿Primera vez en Rentar?"}{" "}
            <Link href={isRegister ? "/login" : "/registro"}>
              {isRegister ? "Iniciá sesión" : "Creá tu cuenta"}
            </Link>
          </p>
          <Link className="auth-demo-link" href="/">Ver panel de demostración <span aria-hidden="true">→</span></Link>
        </div>
        <footer className="auth-footer">
          <span>© 2026 Rentar</span>
          <span>Hecho para salir a la ruta</span>
        </footer>
      </section>
    </main>
  );
}