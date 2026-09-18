"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/format";

export function DashboardShell({
  title,
  items,
  children,
  adminName,
  adminEmail,
}: {
  title: string;
  items: { href: string; label: string }[];
  children: ReactNode;
  adminName?: string;
  adminEmail?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = title.toLowerCase() === "admin";

  async function handleLogout() {
    if (!isAdmin) return;

    await fetch("/api/admin/logout", {
      method: "POST",
    });

    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg">
      {/* Admin header */}
      {isAdmin && (
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            {/* Branding */}
            <Link href="/admin" className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-bold text-white">
                N
              </div>

              <div>
                <p className="text-sm font-bold tracking-tight">
                  NEXORA
                </p>

                <p className="text-[11px] font-medium text-muted">
                  Admin Portal
                </p>
              </div>
            </Link>

            {/* Admin account */}
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 sm:flex">
                <ShieldCheck size={16} className="text-brand" />
                <span className="text-xs font-medium">
                  Administrator
                </span>
              </div>

              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 transition hover:bg-surface-2"
                >
                  <UserCircle size={19} className="text-muted" />

                  <div className="hidden max-w-40 text-left sm:block">
                    <p className="truncate text-sm font-semibold">
                      {adminName || "Administrator"}
                    </p>

                    <p className="text-[11px] text-muted">
                      Admin
                    </p>
                  </div>

                  <ChevronDown size={14} className="text-muted" />
                </button>

                {/* Dropdown */}
                <div className="invisible absolute right-0 top-full z-50 mt-2 w-64 translate-y-1 rounded-2xl border border-line bg-surface p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="px-3 py-3">
                    <p className="truncate text-sm font-semibold">
                      {adminName || "Nexora Administrator"}
                    </p>

                    <p className="mt-1 truncate text-xs text-muted">
                      {adminEmail || "No email configured"}
                    </p>

                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-2 py-1 text-[11px] font-semibold text-brand">
                      <ShieldCheck size={13} />
                      Administrator
                    </div>
                  </div>

                  <div className="my-1 border-t border-line" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* Desktop navigation */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {title}
            </p>

            {isAdmin && (
              <p className="mt-1 text-xs text-muted">
                Manage your grocery store
              </p>
            )}
          </div>

          <nav className="space-y-1">
            {items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-brand text-white shadow-sm"
                      : "text-foreground hover:bg-surface-2",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Mobile navigation */}
          <div className="mb-5 overflow-x-auto pb-1 lg:hidden">
            <div className="flex min-w-max gap-2">
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition",
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-surface hover:bg-surface-2",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {children}
        </div>
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
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/catalog", label: "Products & Inventory" },
  { href: "/admin/users", label: "Customers" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/disputes", label: "Complaints" },
  { href: "/admin/logistics", label: "Delivery" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/analytics", label: "Analytics" },
];