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
  { href: "/account/addresses", label: "Address Book" },
  { href: "/account/settings", label: "Settings" },
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
  <div className="mx-auto max-w-5xl px-4 py-6 pb-12 sm:px-6 sm:py-8">
    {/* Back */}
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-5 flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-brand"
    >
      ← Back
    </button>

    {/* Page heading */}
    <div className="mb-6">
      <p className="text-sm font-medium text-brand">
        My account
      </p>

      <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Welcome back, {user.name?.split(" ")[0] || "there"} 👋
      </h1>

      <p className="mt-1 text-sm text-muted">
        Manage your orders, saved products, addresses and account settings.
      </p>
    </div>

    {/* Profile hero */}
    <Card className="overflow-hidden p-0">
      <div className="bg-gradient-to-br from-brand to-brand/80 p-6 text-white sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold ring-1 ring-white/20">
              {(user.name?.charAt(0) || "U").toUpperCase()}
            </div>

            {/* Customer identity */}
            <div className="min-w-0">
              <p className="truncate text-xl font-bold">
                {user.name}
              </p>

              <p className="mt-1 truncate text-sm text-white/80">
                {user.email}
              </p>

              {user.phone && (
                <p className="mt-1 text-sm text-white/80">
                  {user.phone}
                </p>
              )}
            </div>
          </div>

          <Badge tone="success">
            Customer
          </Badge>
        </div>
      </div>

      {/* Account summary */}
      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-5">
          <p className="text-xs font-medium text-muted">
            Account type
          </p>

          <p className="mt-1 text-sm font-semibold text-ink">
            Customer
          </p>

          <p className="mt-1 text-xs text-muted">
            SundayShop account
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-muted">
            Contact
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-ink">
            {user.phone || user.email || "Not provided"}
          </p>

          <p className="mt-1 text-xs text-muted">
            Registered contact
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-muted">
            Account status
          </p>

          <p className="mt-1 text-sm font-semibold text-emerald-600">
            Active
          </p>

          <p className="mt-1 text-xs text-muted">
            Account in good standing
          </p>
        </div>
      </div>
    </Card>

    {/* Account navigation */}
    <div className="mt-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">
          Your account
        </h2>

        <p className="mt-1 text-sm text-muted">
          Everything you need to manage your SundayShop experience.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group"
          >
            <Card className="flex items-center justify-between p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-surface-2 group-hover:shadow-md">
              <div className="min-w-0">
                <p className="font-semibold text-ink">
                  {link.label}
                </p>

                <p className="mt-1 text-xs text-muted">
                  {link.label === "Orders" &&
                    "Track and manage your purchases"}

                  {link.label === "Wishlist" &&
                    "View products you've saved"}

                  {link.label === "Loyalty" &&
                    "View your loyalty benefits"}

                  {link.label === "Returns" &&
                    "Manage returns and refunds"}

                  {link.label === "Address Book" &&
                    "Manage your saved delivery addresses"}

                  {link.label === "Settings" &&
                    "Manage your account preferences"}
                </p>
              </div>

              <span className="ml-4 shrink-0 text-lg text-muted transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>

    {/* Contact information */}
    <Card className="mt-8 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">
          Contact information
        </h2>

        <p className="mt-1 text-sm text-muted">
          Your registered customer details.
        </p>
      </div>

      <div className="mt-4 divide-y divide-border">
        {/* Name */}
        <div className="py-4">
          <p className="text-xs text-muted">
            Full name
          </p>

          <p className="mt-1 text-sm font-semibold text-ink">
            {user.name || "Not provided"}
          </p>
        </div>

        {/* Email */}
        <div className="py-4">
          <p className="text-xs text-muted">
            Email address
          </p>

          <p className="mt-1 break-all text-sm font-semibold text-ink">
            {user.email || "Not provided"}
          </p>
        </div>

        {/* Phone */}
        <div className="py-4">
          <p className="text-xs text-muted">
            Phone number
          </p>

          <p className="mt-1 text-sm font-semibold text-ink">
            {user.phone || "Not provided"}
          </p>
        </div>
      </div>
    </Card>

    {/* Account access */}
    <Card className="mt-6 border-red-100 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">
          Account access
        </h2>

        <p className="mt-1 text-sm leading-6 text-muted">
          Sign out of your SundayShop account on this device.
        </p>
      </div>

      <Button
        variant="outline"
        className="mt-5 border-red-200 text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm active:scale-[0.98]"
        onClick={logout}
      >
        Log out
      </Button>
    </Card>
  </div>
);
}