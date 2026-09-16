"use client";

import Link from "next/link";
import { GitCompare, Heart, ShoppingCart, Star } from "lucide-react";
import { Badge } from "@/components/ui";
import { useStore } from "@/components/providers";
import { discountPct, inr, wholesalePrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i + 1 <= Math.round(value) ? "fill-current" : "opacity-30"}
        />
      ))}
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { mode, addToCart, toggleWishlist, toggleCompare, wishlist, compare } = useStore();
  const saved = wishlist.includes(product.id);
  const compared = compare.includes(product.id);
  const unit = mode === "b2b" ? wholesalePrice(product.tiers, product.moq) : product.price;
  const off = discountPct(product.mrp, unit);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
      <Link href={`/products/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {off > 0 ? (
          <span className="absolute left-3 top-3">
            <Badge tone="cta">{off}% off</Badge>
          </span>
        ) : null}
        {mode === "b2b" ? (
          <span className="absolute right-3 top-3">
            <Badge tone="brand">MOQ {product.moq}</Badge>
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{product.brand} · {product.location.split(" · ")[0]}</p>
        <Link href={`/products/${product.id}`} className="mt-1 line-clamp-2 font-semibold leading-snug">
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <Stars value={product.rating} />
          <span>
            {product.rating} ({product.reviewCount.toLocaleString("en-IN")})
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-semibold">{inr(unit)}</span>
          {product.mrp > unit ? (
            <span className="text-sm text-muted line-through">{inr(product.mrp)}</span>
          ) : null}
        </div>
        {mode === "b2b" ? (
          <p className="mt-1 text-xs text-muted">Bulk price available · from {inr(product.tiers.at(-1)!.price)}</p>
        ) : (
          <p className="mt-1 text-xs text-muted">{product.deliveryEta} · Sold by a local seller</p>
        )}
        {product.aiReason ? (
          <p className="mt-2 line-clamp-1 text-xs text-ai">{product.aiReason}</p>
        ) : null}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => addToCart(product.id, mode === "b2b" ? product.moq : 1)}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-cta text-sm font-semibold text-white hover:bg-cta-hover"
          >
            <ShoppingCart size={16} /> Add
          </button>
          <button
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            onClick={() => toggleWishlist(product.id)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line hover:bg-surface-2"
          >
            <Heart size={16} className={saved ? "fill-cta text-cta" : ""} />
          </button>
          <button
            aria-label={compared ? "Remove from comparison" : "Compare sellers"}
            onClick={() => toggleCompare(product.id)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line hover:bg-surface-2"
          >
            <GitCompare size={16} className={compared ? "text-brand" : ""} />
          </button>
        </div>
      </div>
    </article>
  );
}
