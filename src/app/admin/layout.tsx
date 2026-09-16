import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell, adminNav } from "@/components/dashboard-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell title="Admin" items={adminNav}>
      <AuthGuard role="admin">{children}</AuthGuard>
    </DashboardShell>
  );
}
