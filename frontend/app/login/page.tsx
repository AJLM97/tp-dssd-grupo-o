import type { Metadata } from "next";
import { LoginScreen } from "@/components/auth/login-screen";

export const metadata: Metadata = {
  title: "Iniciar sesión | Rentar",
};

export default function LoginPage() {
  return <LoginScreen />;
}