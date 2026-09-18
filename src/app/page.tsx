"use client";

import Link from "next/link";
import { categories, products as defaultProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { Badge, Button } from "@/components/ui";
import { useStore } from "@/components/providers";
import { useEffect, useState } from "react";
export default function HomePage() {
const { user } = useStore();
type CatalogProduct = (typeof defaultProducts)[number] & {
  active?: boolean;
};

const [catalogProducts, setCatalogProducts] =
  useState<CatalogProduct[]>(defaultProducts);

useEffect(() => {
  function loadCatalog() {
    const saved = localStorage.getItem(
      "nexora-admin-products",
    );

    if (!saved) {
      setCatalogProducts(defaultProducts);
      return;
    }

    try {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setCatalogProducts(parsed);
      } else {
        setCatalogProducts(defaultProducts);
      }
    } catch {
      setCatalogProducts(defaultProducts);
    }
  }

  loadCatalog();

  function handleStorage(event: StorageEvent) {
    if (event.key === "nexora-admin-products") {
      loadCatalog();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", loadCatalog);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", loadCatalog);
  };
}, []);

const activeProducts = catalogProducts.filter(
  (product) => product.active !== false,
);
const deals = activeProducts
.filter(
(p) =>
p.mrp > p.price &&
((p.mrp - p.price) / p.mrp) * 100 >= 10
)
.slice(0, 4);

const best = [...activeProducts]
.sort((a, b) => b.sold - a.sold)
.slice(0, 4);

const recs = activeProducts
.filter((p) => p.aiReason)
.slice(0, 3);

// -------------------------
// LANDING PAGE
// -------------------------
if (!user) {
return ( <main className="min-h-screen bg-bg">
{/* Hero */} <section className="mx-auto max-w-7xl px-4 pt-10 sm:pt-16"> <div className="overflow-hidden rounded-[2rem] bg-brand px-6 py-12 text-white shadow-[var(--shadow)] sm:px-10 sm:py-16 lg:px-14"> <div className="max-w-3xl"> <Badge tone="ai">Fresh groceries • Better prices</Badge>

```
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Fresh groceries.
            <br />
            Low prices.
            <br />
            Delivered in a day.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
            Shop fruits, vegetables and everyday essentials at
            prices made for everyday shopping.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login">
              <Button size="lg">Start shopping</Button>
            </Link>

            <Link
              href="/products"
              className="inline-flex items-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Explore groceries
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* USP */}
    <section className="mx-auto max-w-7xl px-4 pt-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: "💰",
            title: "Low prices",
            text: "Everyday essentials at competitive prices.",
          },
          {
            icon: "🥬",
            title: "Fresh products",
            text: "Fresh fruits, vegetables and groceries.",
          },
          {
            icon: "🚚",
            title: "1-day delivery",
            text: "Get your order delivered within a day.",
          },
          {
            icon: "💵",
            title: "Cash on delivery",
            text: "Order first and pay when it arrives.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <div className="text-2xl">{item.icon}</div>
            <h3 className="mt-3 font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>

    {/* Preview products */}
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-brand">
            Shop smarter
          </p>
          <h2 className="mt-1 text-2xl font-bold">
            See what's available
          </h2>
        </div>

        <Link
          href="/login"
          className="text-sm font-semibold text-brand"
        >
          Shop now →
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {activeProducts.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>

    {/* Final CTA */}
    <section className="mx-auto max-w-7xl px-4 pb-16">
      <div className="rounded-3xl border border-line bg-surface px-6 py-10 text-center sm:px-10">
        <h2 className="text-2xl font-bold">
          Ready to shop smarter?
        </h2>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
          Create your Nexora account and start shopping fresh
          groceries at great prices.
        </p>

        <div className="mt-6">
          <Link href="/login">
            <Button size="lg">Create your account</Button>
          </Link>
        </div>
      </div>
    </section>
  </main>
);


}

// -------------------------
// CUSTOMER HOME
// -------------------------
return ( <main className="pb-12">
{/* Welcome */} <section className="mx-auto max-w-7xl px-4 pt-7"> <div className="rounded-3xl bg-brand px-6 py-8 text-white sm:px-8"> <p className="text-sm text-white/70">
Welcome back{user.name ? `, ${user.name}` : ""} </p>

      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        What are you shopping for today?
      </h1>

      <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
        Fresh groceries, low prices and convenient delivery.
      </p>

      <Link
        href="/products"
        className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand"
      >
        Shop groceries →
      </Link>
    </div>
  </section>

  {/* Categories */}
  <section className="mx-auto max-w-7xl px-4 pt-10">
    <div className="flex items-end justify-between">
      <div>
        <p className="text-sm text-muted">Browse</p>
        <h2 className="text-2xl font-bold">Shop by category</h2>
      </div>

      <Link
        href="/products"
        className="text-sm font-semibold text-brand"
      >
        View all →
      </Link>
    </div>

    <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/products?category=${category.slug}`}
          className="min-w-[105px] rounded-2xl border border-line bg-surface p-4 text-center transition hover:-translate-y-0.5"
        >
          <div className="text-3xl">{category.emoji}</div>
          <p className="mt-2 whitespace-nowrap text-sm font-semibold">
            {category.name}
          </p>
        </Link>
      ))}
    </div>
  </section>

  {/* Low prices */}
  <section className="mx-auto max-w-7xl px-4 pt-12">
    <div className="flex items-end justify-between">
      <div>
        <p className="text-sm font-semibold text-cta">
          💰 Save more
        </p>
        <h2 className="mt-1 text-2xl font-bold">
          Today's low prices
        </h2>
        <p className="mt-1 text-sm text-muted">
          Great deals on everyday essentials.
        </p>
      </div>

      <Link
        href="/deals"
        className="text-sm font-semibold text-brand"
      >
        See all →
      </Link>
    </div>

    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {deals.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </section>

  {/* Smart picks */}
  <section className="mx-auto max-w-7xl px-4 pt-12">
    <div className="rounded-3xl border border-line bg-surface p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-xl">
          ✨
        </div>

        <div>
          <h2 className="text-xl font-bold">
            Smart picks for you
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted">
            Nexora can help you find good-value products based on
            price, availability and delivery time.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recs.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  </section>

  {/* Fresh picks */}
  <section className="mx-auto max-w-7xl px-4 pt-12">
    <div>
      <p className="text-sm font-semibold text-brand">
        🥬 Fresh today
      </p>
      <h2 className="mt-1 text-2xl font-bold">
        Popular groceries
      </h2>
    </div>

    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {best.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </section>

  {/* Delivery promise */}
  <section className="mx-auto max-w-7xl px-4 pt-12">
    <div className="rounded-3xl bg-surface border border-line p-6 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <div className="text-2xl">🚚</div>
          <h3 className="mt-3 font-semibold">
            Delivered within a day
          </h3>
          <p className="mt-1 text-sm text-muted">
            Get your everyday groceries without the long wait.
          </p>
        </div>

        <div>
          <div className="text-2xl">💵</div>
          <h3 className="mt-3 font-semibold">
            Cash on delivery
          </h3>
          <p className="mt-1 text-sm text-muted">
            Pay when your order reaches your doorstep.
          </p>
        </div>

        <div>
          <div className="text-2xl">📍</div>
          <h3 className="mt-3 font-semibold">
            Track your order
          </h3>
          <p className="mt-1 text-sm text-muted">
            Follow your delivery status from order to doorstep.
          </p>
        </div>
      </div>
    </div>
  </section>
</main>

);
}
