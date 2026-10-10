import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Crear cuenta | Rentar",
};

export default function RegisterPage() {
  return <AuthScreen mode="register" />;
}