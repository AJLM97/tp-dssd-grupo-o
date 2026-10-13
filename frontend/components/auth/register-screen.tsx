"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Input } from "@/components/ui/form-controls";
import { crearCliente } from "@/lib/api-rest";

export function RegisterScreen() {
    const [notice, setNotice] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const campos = new FormData(event.currentTarget);

        const password = String(campos.get("password") ?? "");
        const repeatPassword = String(campos.get("repeatPassword") ?? "");

        if (password !== repeatPassword) {
            setNotice("Las contraseñas no coinciden.");
            return;
        }

        try {
            await crearCliente({
                documento: String(campos.get("documento") ?? ""),
                nombre: String(campos.get("firstName") ?? ""),
                apellido: String(campos.get("lastName") ?? ""),
                email: String(campos.get("email") ?? ""),
                password: String(password),
                telefono: String(campos.get("phone") ?? ""),
                fechaNacimiento: String(campos.get("fechaNacimiento") ?? ""),
            });

            setNotice("Cuenta creada correctamente.");
        } catch (error) {
            setNotice(error instanceof Error ? error.message : "No se pudo crear la cuenta.");
        }
    }

    return (
        <main className="auth-page">
            <section className={`auth-visual auth-visual-register`} aria-label="Vehículo disponible para alquilar">
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
                    <p className="auth-eyebrow">CREÁ TU CUENTA</p>
                    <h2>Empezá a moverte.</h2>
                    <p className="auth-intro">
                        "Un perfil, todos los caminos por descubrir."
                    </p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-name-row">
                            <Input label="Nombre" name="firstName" autoComplete="given-name" placeholder="Lucía" required />
                            <Input label="Apellido" name="lastName" autoComplete="family-name" placeholder="Pérez" required />
                        </div>
                        <Input
                            label="Correo electrónico"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="nombre@correo.com"
                            required
                        />
                        <Input label="Teléfono" name="phone" type="tel" autoComplete="tel" placeholder="+54 11 5555 0101" required />

                        <Input
                            label="Documento"
                            name="documento"
                            placeholder="Ingrese su DNI"
                            required
                        />
                        <Input
                            label="Fecha de nacimiento"
                            name="fechaNacimiento"
                            type="date"
                            required
                        />
                        <Input
                            label="Contraseña"
                            name="password"
                            type="password"
                            autoComplete={"new-password"}
                            placeholder="Al menos 8 caracteres"
                            minLength={8}
                            required
                        />
                        <Input
                            label="Repetir contraseña"
                            name="repeatPassword"
                            type="password"
                            autoComplete={"new-password"}
                            placeholder="Al menos 8 caracteres"
                            minLength={8}
                            required
                        />
                        <label className="auth-terms">
                            <input type="checkbox" required />
                            <span>Acepto los términos y condiciones del servicio.</span>
                        </label>
                        <button className="auth-submit cursor-pointer" type="submit">
                            {"Crear cuenta"}
                            <span aria-hidden="true">↗</span>
                        </button>
                        {notice ? <p className="auth-notice" role="status">{notice}</p> : null}
                    </form>

                    <p className="auth-switch">
                        {"¿Ya tenés una cuenta?"}{" "}
                        <Link href={"/login"}>
                            {"Iniciá sesión"}
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
