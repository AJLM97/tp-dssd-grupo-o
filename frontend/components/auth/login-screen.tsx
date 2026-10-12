"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Input } from "@/components/ui/form-controls";
import { iniciarSesion } from "@/lib/api-rest";
import { useRouter } from "next/navigation";

export function LoginScreen() {
    const [notice, setNotice] = useState("");
    const router = useRouter();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const campos = new FormData(event.currentTarget);

        try {
            const sesion = await iniciarSesion(
                String(campos.get("email") ?? ""),
                String(campos.get("password") ?? ""),
            );

            localStorage.setItem("rentar-session", JSON.stringify(sesion));

            if (sesion.user.rol === "ADMIN") {
                router.push("/admin");
            } else {
                router.push("/cliente");
            }
        } catch (error) {
            setNotice(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
        }
    }

    return (
        <main className="auth-page">
            <section className={`auth-visual`} aria-label="Vehículo disponible para alquilar">
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
                    <p className="auth-eyebrow">{"BIENVENIDO DE VUELTA"}</p>
                    <h2>{"Tu viaje te espera."}</h2>
                    <p className="auth-intro">
                        {"Ingresá a tu espacio Rentar y seguí en camino."}
                    </p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <Input
                            label="Correo electrónico"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="nombre@correo.com"
                            required
                        />
                        <Input
                            label="Contraseña"
                            name="password"
                            type="password"
                            autoComplete={"current-password"}
                            placeholder="Al menos 8 caracteres"
                            minLength={8}
                            required
                        />
                        <div className="auth-form-meta">
                            <label className="auth-remember"><input type="checkbox" /> Recordarme</label>
                            <button type="button" className="auth-text-button" onClick={() => setNotice("La recuperación de contraseña se habilitará junto con la autenticación.")}>¿Olvidaste tu contraseña?</button>
                        </div>
                        <button className="auth-submit cursor-pointer" type="submit">
                            {"Iniciar sesión"}
                            <span aria-hidden="true">↗</span>
                        </button>
                        {notice ? <p className="auth-notice" role="status">{notice}</p> : null}
                    </form>

                    <p className="auth-switch">
                        {"¿Primera vez en Rentar?"}{" "}
                        <Link href={"/registro"}>
                            {"Creá tu cuenta"}
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
