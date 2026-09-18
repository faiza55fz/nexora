import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/format";

export function DashboardShell({
  title,
  items,
  children,
}: {
  title: string;
  items: { href: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside className="hidden w-56 shrink-0 lg:block">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
        <nav className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-surface-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium")}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

export const b2bNav = [
  { href: "/b2b", label: "Dashboard" },
  { href: "/b2b/bulk", label: "Bulk order" },
  { href: "/b2b/rfq", label: "RFQs" },
  { href: "/b2b/negotiate", label: "Negotiation" },
  { href: "/b2b/purchase-orders", label: "Purchase orders" },
  { href: "/b2b/invoices", label: "Invoices" },
];

export const sellerNav = [
  { href: "/seller", label: "🏠 Home" },
  { href: "/seller/orders", label: "📦 Orders" },
  { href: "/seller/products", label: "🥕 My products" },
  { href: "/seller/products/new", label: "➕ Add product" },
  { href: "/seller/inventory", label: "📋 Stock" },
  { href: "/seller/finance", label: "💰 Earnings" },
];

export const adminNav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/catalog", label: "Catalog" },
  { href: "/admin/orders", label: "Orders & payments" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/logistics", label: "Logistics" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/analytics", label: "Analytics" },
];
