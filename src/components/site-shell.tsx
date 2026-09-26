"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import {
  BottomNav,
  Footer,
  Header,
} from "@/components/storefront-chrome";

function SiteShellContent({
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

export function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <SiteShellContent>{children}</SiteShellContent>
    </Suspense>
  );
}