"use client";
import Link from "next/link";
import { Package, Plus, ShoppingBasket, WalletCards } from "lucide-react";
import { products, orders } from "@/lib/data";
import { useStore } from "@/components/providers";
import { Button, Card, Kpi, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function SellerHome() {
  const { user } = useStore();
  const newOrders = orders.filter((o) => o.status === "placed" || o.status === "confirmed").length;
  const lowStock = products.filter((p) => p.stock < 50).length;

  return (
    <div>
      <PageHeader title={`Good evening, ${user?.name || "Vendor"} 👋`} subtitle="Your vendor profile and shop management" />
      <Card className="mb-6 border-brand/20 bg-brand-soft p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-lg font-bold">{user?.businessName || "Vendor profile not completed"}</p><p className="text-sm text-muted">{user?.city || "Add your shop location during registration"}</p></div>
          <span className="rounded-full bg-warning-soft px-3 py-1.5 text-sm font-semibold capitalize text-warning">{user?.vendorStatus?.replaceAll("-", " ") || "not registered"}</span>
        </div>
        {user?.vendorStatus === "pending" ? <p className="mt-3 text-sm">Your registration is waiting for admin approval. You can review your profile while approval is pending.</p> : null}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="New orders" value={String(Math.max(5, newOrders))} hint="Need your attention" />
        <Kpi label="Today's sales" value={inr(4250)} hint="So far today" />
        <Kpi label="Products" value={String(products.length)} hint={`${lowStock} need restocking`} />
        <Kpi label="Rating" value="4.8 ★" hint="Customers like your shop" />
      </div>

      <h2 className="mt-8 text-xl font-bold">What would you like to do?</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/seller/orders" className="block">
          <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <Package className="h-9 w-9 text-brand" />
            <p className="mt-4 text-lg font-bold">View orders</p>
            <p className="mt-1 text-sm text-muted">See new orders and mark them ready.</p>
          </Card>
        </Link>
        <Link href="/seller/products/new" className="block">
          <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <Plus className="h-9 w-9 text-cta" />
            <p className="mt-4 text-lg font-bold">Add product</p>
            <p className="mt-1 text-sm text-muted">Add fruits, vegetables or groceries.</p>
          </Card>
        </Link>
        <Link href="/seller/products" className="block">
          <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <ShoppingBasket className="h-9 w-9 text-brand" />
            <p className="mt-4 text-lg font-bold">My products</p>
            <p className="mt-1 text-sm text-muted">Change prices and check stock.</p>
          </Card>
        </Link>
        <Link href="/seller/finance" className="block">
          <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <WalletCards className="h-9 w-9 text-brand" />
            <p className="mt-4 text-lg font-bold">My earnings</p>
            <p className="mt-1 text-sm text-muted">See today's and monthly sales.</p>
          </Card>
        </Link>
      </div>

      <Card className="mt-8 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold">Orders needing attention</h2><p className="text-sm text-muted">Start with these orders first.</p></div>
          <Link href="/seller/orders"><Button variant="soft">View all orders</Button></Link>
        </div>
        <div className="mt-4 space-y-3">
          {orders.slice(0, 3).map((o) => (
            <div key={o.id} className="rounded-2xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-bold">{o.id}</p><p className="text-sm text-muted">{o.items.reduce((n, i) => n + i.qty, 0)} items · {inr(o.total)}</p></div>
                <span className="rounded-full bg-warning-soft px-3 py-1 text-sm font-semibold capitalize text-warning">{o.status.replaceAll("-", " ")}</span>
              </div>
              {o.status !== "delivered" ? <Link href="/seller/orders" className="mt-3 inline-block"><Button size="lg">Handle this order</Button></Link> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
