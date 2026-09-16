import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth-guard";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AuthGuard role="customer">{children}</AuthGuard>;
}
