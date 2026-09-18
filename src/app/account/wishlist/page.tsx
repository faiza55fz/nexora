"use client";

import Link from "next/link";
import { products } from "@/lib/data";
import { useStore } from "@/components/providers";
import { ProductCard } from "@/components/product-card";

export default function WishlistPage() {
  const { wishlist } = useStore();
  const items = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/account"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-brand"
      >
        ← Back to account
      </Link>

      <h1 className="text-2xl font-semibold">Wishlist</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}