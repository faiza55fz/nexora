import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell, sellerNav } from "@/components/dashboard-shell";

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell title="Seller" items={sellerNav}>
      <AuthGuard role="vendor">{children}</AuthGuard>
    </DashboardShell>
  );
}
