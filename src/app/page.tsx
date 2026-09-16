"use client";

import Link from "next/link";
import { categories, products } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { Badge, Button, Card } from "@/components/ui";
import { useStore } from "@/components/providers";

export default function HomePage() {
  const { user } = useStore();
  const deals = products.filter((p) => p.mrp > p.price && ((p.mrp - p.price) / p.mrp) * 100 >= 10);
  const best = [...products].sort((a, b) => b.sold - a.sold).slice(0, 4);
  const recs = products.filter((p) => p.aiReason);

  if (!user) {
    return (
      <div className="min-h-[75vh] bg-bg">
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <Badge tone="ai">One marketplace. Local sellers. Fresh groceries.</Badge>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Fresh groceries from trusted local sellers, all in one place.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">Nexora connects customers, businesses and local grocery & fruit vendors in one simple marketplace.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/login"><Button size="lg">Log in / Create account</Button></Link>
            <Link href="/sell"><Button size="lg" variant="outline">Sell on Nexora</Button></Link>
          </div>
          <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
            <Card className="p-5"><p className="text-2xl">🛒</p><p className="mt-3 font-bold">For customers</p><p className="mt-1 text-sm text-muted">Compare local sellers and shop fresh groceries.</p></Card>
            <Card className="p-5"><p className="text-2xl">🏪</p><p className="mt-3 font-bold">For vendors</p><p className="mt-1 text-sm text-muted">Manage products, stock and orders from one simple profile.</p></Card>
            <Card className="p-5"><p className="text-2xl">📦</p><p className="mt-3 font-bold">For businesses</p><p className="mt-1 text-sm text-muted">Source groceries in bulk from suitable suppliers.</p></Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl bg-brand px-8 py-12 text-white shadow-[var(--shadow)]">
            <Badge tone="ai">Smart search</Badge>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight">
              Fresh groceries from local sellers — all in one marketplace.
            </h1>
            <p className="mt-4 max-w-lg text-white/80">
              Compare local sellers by price, availability and delivery, then order your fruits and groceries with ease.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand">
                Shop groceries
              </Link>
              <Link href="/b2b" className="rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold">
                Switch to B2B
              </Link>
            </div>
          </div>
          <div className="grid gap-4">
            <Link href="/deals" className="rounded-3xl bg-cta p-6 text-white shadow-[var(--shadow)]">
              <p className="text-sm opacity-90">Deals of the day</p>
              <p className="mt-2 text-2xl font-semibold">Fresh deals on fruits & groceries</p>
              <p className="mt-2 text-sm opacity-80">Fresh prices · Limited-time offers</p>
            </Link>
            <Link href="/seller/register" className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow)]">
              <p className="text-sm text-muted">Sellers</p>
              <p className="mt-2 text-xl font-semibold">Start selling in 15 minutes</p>
              <p className="mt-2 text-sm text-muted">Register your shop, add products and manage orders from one simple dashboard.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-12">
        <h2 className="text-xl font-semibold">Categories</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className="rounded-2xl border border-line bg-surface p-4 text-center shadow-[var(--shadow)]"
            >
              <div className="text-2xl">{c.emoji}</div>
              <p className="mt-2 text-sm font-medium">{c.name}</p>
              <p className="text-xs text-muted">{c.count.toLocaleString("en-IN")}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-12">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">Deals</h2>
            <p className="text-sm text-muted">Good prices from verified local sellers</p>
          </div>
          <Link href="/deals" className="text-sm font-semibold text-brand">
            See all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {deals.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-12">
        <h2 className="text-xl font-semibold">Recommended for you</h2>
        <p className="text-sm text-muted">Suggestions based on what you shop for</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recs.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-12">
        <h2 className="text-xl font-semibold">Best sellers</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {best.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
