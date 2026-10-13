import { RoleGuard } from "@/components/auth/role-guard";
import DashboardWorkspace from "@/components/dashboard/dashboard-workspace";

export const metadata = {
  title: "Mi espacio | Rentar",
};

export default function CustomerPage() {
  return (
    <RoleGuard role="CLIENTE">
      <DashboardWorkspace role="CLIENTE" />
    </RoleGuard>
  );
}