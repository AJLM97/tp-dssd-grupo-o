"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { AppRole } from "@/lib/rentar-types";

type RoleGuardProps = {
    role: AppRole;
    children: ReactNode;
};

export function RoleGuard({ role, children }: RoleGuardProps) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const guardLogin = () => {
            const storedSession = localStorage.getItem("rentar-session");

            if (!storedSession) {
                router.replace("/login");
                return;
            }

            try {
                const session = JSON.parse(storedSession) as {
                    user?: { rol?: string };
                };
                const userRole = session.user?.rol;

                if (userRole !== "ADMIN" && userRole !== "CLIENTE") {
                    router.replace("/login");
                    return;
                }

                if (userRole !== role) {
                    router.replace(userRole === "ADMIN" ? "/admin" : "/cliente");
                    return;
                }

                setAuthorized(true);
            } catch {
                localStorage.removeItem("rentar-session");
                router.replace("/login");
            }
        };

        guardLogin();
    }, [role, router]);

    if (!authorized) return null;

    return children;
}