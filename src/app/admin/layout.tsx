import type { ReactNode } from "react";
import { DashboardShell, adminNav } from "@/components/dashboard-shell";

export default function AdminLayout({
children,
}: {
children: ReactNode;
}) {
const adminName = process.env.ADMIN_NAME || "Nexora Administrator";
const adminEmail = process.env.ADMIN_EMAIL || "Admin";

return ( <DashboardShell
   title="Admin"
   items={adminNav}
   adminName={adminName}
   adminEmail={adminEmail}
 >
{children} </DashboardShell>
);
}
