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

if (isAdmin) {
return <main>{children}</main>;
}

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
