"use client";

import Link from "next/link";
import { useStore } from "@/components/providers";
import { Badge, Button, Card } from "@/components/ui";

const links = [
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/loyalty", label: "Loyalty" },
  { href: "/account/returns", label: "Returns" },
];

export default function AccountPage() {
  const { user, logout } = useStore();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Account</h1>
      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xl font-semibold">{user?.name}</p>
            <p className="text-sm text-muted">{user?.email}{user?.phone ? ` · ${user.phone}` : ""}</p>
            <p className="mt-2 text-sm">Your customer profile is ready. Add your delivery address during checkout.</p>
          </div>
          <Badge tone="success">Customer</Badge>
        </div>
      </Card>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="p-5 font-semibold hover:bg-surface-2">{l.label}</Card>
          </Link>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/b2b">
          <Button>Open business dashboard</Button>
        </Link>
        <Link href="/sell">
          <Button variant="outline">Become a seller</Button>
        </Link>
        <Button variant="outline" onClick={logout}>Log out</Button>
      </div>
    </div>
  );
}
