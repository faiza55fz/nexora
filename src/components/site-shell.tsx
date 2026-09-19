"use client";

import { usePathname } from "next/navigation";
import {
  BottomNav,
  Footer,
  Header,
} from "@/components/storefront-chrome";

export function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");
  const isDelivery = pathname.startsWith("/delivery");

  // Admin and delivery portals have their own layouts/navigation.
  if (isAdmin || isDelivery) {
    return <main>{children}</main>;
  }

  // Customer website shell.
  return (
    <>
      <Header />

      <main className="pb-20 md:pb-0">
        {children}
      </main>

      <Footer />

      <BottomNav />
    </>
  );
}