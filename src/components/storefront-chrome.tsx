"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Heart,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sparkles,
  Sun,
  User,
  X,
} from "lucide-react";
import { useStore } from "@/components/providers";
import { categories, products } from "@/lib/data";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/format";

export function Header() {
  const { mode, setMode, theme, toggleTheme, cart, wishlist, notifications, compare, user } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState(false);
  const [notes, setNotes] = useState(false);
  const router = useRouter();
  const suggestions = products.filter((p) =>
    q.length > 1 ? p.name.toLowerCase().includes(q.toLowerCase()) : false,
  ).slice(0, 4);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="bg-brand text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <p>Fresh local groceries · Compare sellers · UPI, cards & cash on delivery</p>
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/sell" className="hover:underline">
              Sell on Nexora
            </Link>
            <Link href="/track/NXR-240918-1842" className="hover:underline">
              Track order
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button className="lg:hidden" aria-label="Menu" onClick={() => setOpen(true)}>
          <Menu />
        </button>
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white">N</span>
          <span className="text-lg">Nexora</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <button
            className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-2"
            onClick={() => setCats((v) => !v)}
          >
            Categories
          </button>
          <Link
            href="/b2b"
            onClick={() => setMode("b2b")}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-2",
              mode === "b2b" && "bg-brand-soft text-brand",
            )}
          >
            B2B
          </Link>
          <Link href="/deals" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-2">
            Deals
          </Link>
          <Link href="/sell" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-2">
            Sell
          </Link>
        </nav>
        <form
          className="relative mx-2 hidden flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/products?q=${encodeURIComponent(q)}`);
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search fruits, vegetables, groceries…"
            className="h-11 w-full rounded-xl border border-line bg-bg pl-10 pr-24 text-sm"
            aria-label="Search fruits, vegetables and groceries"
          />
          <span className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg bg-ai-soft px-2 py-1 text-[11px] font-semibold text-ai sm:inline-flex">
            <Sparkles size={12} /> Smart search
          </span>
          {suggestions.length > 0 ? (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow)]">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/products/${s.id}`}
                    className="block px-3 py-2 text-sm hover:bg-surface-2"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </form>
        <div className="ml-auto flex items-center gap-1">
          <button
            className="hidden rounded-lg px-2 py-2 text-xs font-semibold sm:inline"
            onClick={() => setMode(mode === "b2c" ? "b2b" : "b2c")}
            aria-pressed={mode === "b2b"}
          >
            {mode === "b2b" ? "Business" : "Personal"}
          </button>
          <button aria-label="Toggle theme" className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/account/wishlist" className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2" aria-label="Wishlist">
            <Heart size={18} />
            {wishlist.length ? (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-cta px-1 text-[10px] text-white">
                {wishlist.length}
              </span>
            ) : null}
          </Link>
          <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2" aria-label="Cart">
            <ShoppingBag size={18} />
            {cart.length ? (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-cta px-1 text-[10px] text-white">
                {cart.reduce((n, i) => n + i.qty, 0)}
              </span>
            ) : null}
          </Link>
          <div className="relative">
            <button
              aria-label="Notifications"
              className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2"
              onClick={() => setNotes((v) => !v)}
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cta" />
            </button>
            {notes ? (
              <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow)]">
                {notifications.map((n) => (
                  <div key={n.id} className="rounded-xl px-3 py-2 hover:bg-surface-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted">{n.body}</p>
                    <p className="text-[11px] text-muted">{n.time}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {user ? (
            <Link href={user.role === "vendor" ? "/seller" : user.role === "admin" ? "/admin" : "/account"} className="flex h-10 items-center gap-2 rounded-xl px-2 hover:bg-surface-2" aria-label="Profile">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-brand"><User size={17} /></span>
              <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">{user.name}</span>
            </Link>
          ) : (
            <Link href="/login" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">Log in</Link>
          )}
        </div>
      </div>
      {cats ? (
        <div className="border-t border-line bg-surface">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-4 sm:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/products?category=${c.slug}`}
                className="rounded-xl border border-line px-3 py-3 text-sm hover:bg-surface-2"
                onClick={() => setCats(false)}
              >
                {c.emoji} {c.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <form
        className="px-4 pb-3 md:hidden"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/products?q=${encodeURIComponent(q)}`);
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Nexora"
            className="h-11 w-full rounded-xl border border-line bg-bg pl-10 text-sm"
          />
        </div>
      </form>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside
            className="h-full w-72 bg-surface p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <strong>Menu</strong>
              <button aria-label="Close" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <Link href="/products" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-surface-2">
                Shop
              </Link>
              <Link href="/b2b" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-surface-2">
                B2B dashboard
              </Link>
              <Link href="/deals" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-surface-2">
                Deals
              </Link>
              <Link href="/sell" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-surface-2">
                Sell
              </Link>
              {user?.role === "vendor" ? <Link href="/seller" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-surface-2">Seller hub</Link> : null}
              {user?.role === "admin" ? <Link href="/admin" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-surface-2">Admin</Link> : null}
              {compare.length ? (
                <Link href="/compare" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-surface-2">
                  Compare ({compare.length})
                </Link>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
      {compare.length > 0 ? (
        <div className="border-t border-line bg-brand-soft px-4 py-2 text-center text-sm">
          <Link href="/compare" className="font-medium text-brand">
            Compare {compare.length} products <Badge tone="ai">AI comparison</Badge>
          </Link>
        </div>
      ) : null}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-semibold">Nexora</p>
          <p className="mt-2 text-sm text-muted">
            A multi-vendor marketplace connecting customers and local grocery & fruit sellers.
          </p>
        </div>
        <div>
          <p className="font-semibold">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/products">All products</Link>
            </li>
            <li>
              <Link href="/deals">Deals</Link>
            </li>
            <li>
              <Link href="/b2b">Business mode</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Partners</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/seller/register">Become a seller</Link>
            </li>
            <li>
              <Link href="/seller">Seller dashboard</Link>
            </li>
            <li>
              <Link href="/admin">Admin console</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Trust</p>
          <p className="mt-3 text-sm text-muted">
            Simple checkout with UPI, cards and cash on delivery. Delivery and return rules can vary by seller.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function BottomNav() {
  const { cart } = useStore();
  const items = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Search" },
    { href: "/cart", label: `Cart (${cart.reduce((n, i) => n + i.qty, 0)})` },
    { href: "/account", label: "Profile" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className="py-3 text-center text-xs font-medium">
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
