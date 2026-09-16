import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell, b2bNav } from "@/components/dashboard-shell";

export default function B2BLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell title="Business" items={b2bNav}>
      <AuthGuard role="customer">{children}</AuthGuard>
    </DashboardShell>
  );
}
