"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { useStore } from "@/components/providers";

export function AuthGuard({ children, role }: { children: ReactNode; role?: "customer" | "vendor" | "admin" }) {
  const { user } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (role && user.role !== role && !(role === "vendor" && pathname === "/seller/register")) router.replace(user.role === "vendor" ? "/seller" : user.role === "admin" ? "/admin" : "/account");
  }, [ready, user, role, router, pathname]);

  if (!ready || !user || (role && user.role !== role && !(role === "vendor" && pathname === "/seller/register"))) {
    return <div className="mx-auto max-w-xl px-4 py-16"><Card className="p-8 text-center"><h1 className="text-2xl font-bold">Login required</h1><p className="mt-2 text-muted">Please log in to continue.</p><Link href={`/login?next=${encodeURIComponent(pathname)}`}><Button className="mt-6" size="lg">Go to login</Button></Link></Card></div>;
  }
  return <>{children}</>;
}
