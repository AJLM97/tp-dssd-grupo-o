import { RoleGuard } from "@/components/auth/role-guard";
import DashboardWorkspace from "@/components/dashboard/dashboard-workspace";

export const metadata = {
  title: "Administración | Rentar",
};

export default function AdminPage() {
  return (
    <RoleGuard role="ADMIN">
      <DashboardWorkspace role="ADMIN" />
    </RoleGuard>
  );
}