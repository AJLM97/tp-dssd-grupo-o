import type { Metadata } from "next";
import { RegisterScreen } from "@/components/auth/register-screen";

export const metadata: Metadata = {
  title: "Crear cuenta | Rentar",
};

export default function RegisterPage() {
  return <RegisterScreen />;
}