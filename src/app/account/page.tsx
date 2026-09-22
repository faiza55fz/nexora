"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/providers";
import { Badge, Button, Card } from "@/components/ui";

const links = [
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/loyalty", label: "Loyalty" },
  { href: "/account/returns", label: "Returns" },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, authReady, logout } = useStore();

  if (!authReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-brand" />

          <p className="text-sm text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <Card className="w-full p-8 text-center">
          <h1 className="text-xl font-semibold">Login required</h1>

          <p className="mt-2 text-sm text-muted">
            Please log in to continue.
          </p>

          <Button
            className="mt-5"
            onClick={() => router.push("/login")}
          >
            Go to login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-2 text-sm font-medium text-muted hover:text-brand"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-semibold">Account</h1>

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xl font-semibold">{user.name}</p>

            <p className="text-sm text-muted">
              {user.email}
              {user.phone ? ` · ${user.phone}` : ""}
            </p>

            <p className="mt-2 text-sm">
              Your customer profile is ready. Add your delivery address
              during checkout.
            </p>
          </div>

          <Badge tone="success">Customer</Badge>
        </div>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="p-5 font-semibold hover:bg-surface-2">
              {l.label}
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" onClick={logout}>
          Log out
        </Button>
      </div>
    </div>
  );
}