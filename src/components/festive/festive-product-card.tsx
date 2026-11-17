"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Heart, ShoppingCart, Star } from "lucide-react";
import { useStore } from "@/components/providers";
import { discountPct, inr } from "@/lib/format";
import { showFallbackImage, type FestiveProduct } from "./campaign-utils";
import type { FestivalTheme } from "./festival-themes";

// Matches the cart's default per-item order limit.
const MAX_ORDER_QUANTITY = 5;

type FestiveProductCardProps = {
  product: FestiveProduct;
  theme: FestivalTheme;
  className?: string;
};

export function FestiveProductCard({
  product,
  theme,
  className = "",
}: FestiveProductCardProps) {
  const { addToCart, cart, toggleWishlist, wishlist } = useStore();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 1600);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  const saved = wishlist.includes(product.id);
  const inCartQty =
    cart.find((item) => item.productId === product.id)?.qty ?? 0;

  const mrpOff = discountPct(product.mrp, product.price);
  const unavailable = !product.active || product.stock <= 0 || !product.variantId;
  const cartLimit = Math.min(MAX_ORDER_QUANTITY, product.stock);
  const atCartLimit = inCartQty >= cartLimit;
  const href = `/products/${product.id}`;

  function handleAdd() {
    if (unavailable || atCartLimit) return;
    addToCart(product.id, 1);
    setJustAdded(true);
  }

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
        <Link href={href} className="block h-full w-full" aria-label={product.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            width={400}
            height={400}
            loading="lazy"
            decoding="async"
            onError={showFallbackImage}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              unavailable ? "opacity-60 grayscale" : ""
            }`}
          />
        </Link>

        {product.festiveDiscount > 0 ? (
          <span
            className="pointer-events-none absolute left-0 top-3 rounded-r-full py-1 pl-2.5 pr-3 text-[10px] font-extrabold uppercase tracking-wide shadow-sm sm:text-[11px]"
            style={{ background: theme.accent, color: theme.accentInk }}
          >
            {product.festiveDiscount}% Festive Off
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={saved}
          className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-sm backdrop-blur transition active:scale-90 ${
            saved ? "text-red-500" : "text-slate-500 hover:text-red-500"
          }`}
        >
          <Heart size={15} className={saved ? "fill-red-500" : ""} />
        </button>

        {unavailable ? (
          <span className="pointer-events-none absolute inset-x-2 bottom-2 rounded-lg bg-black/70 py-1 text-center text-[11px] font-bold uppercase tracking-wide text-white">
            Out of stock
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <div className="flex min-h-[14px] items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-[11px]">
          <span className="truncate">{product.brand}</span>
          {product.unit ? (
            <span className="shrink-0 normal-case tracking-normal text-ink/70">
              {product.unit}
            </span>
          ) : null}
        </div>

        <Link
          href={href}
          title={product.name}
          className="mt-1 line-clamp-2 min-h-[2.4rem] text-[13px] font-medium capitalize leading-[1.35] text-ink transition hover:text-brand"
        >
          {product.name}
        </Link>

        <div className="mt-1 min-h-[20px]">
          {product.rating > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px]">
              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 font-bold text-white">
                {product.rating.toFixed(1)}
                <Star size={10} className="fill-current" />
              </span>
              {product.reviewCount > 0 ? (
                <span className="text-muted">
                  ({product.reviewCount.toLocaleString("en-IN")})
                </span>
              ) : null}
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-2">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-[15px] font-bold text-ink sm:text-base">
              {inr(product.price)}
            </span>
            {product.mrp > product.price ? (
              <>
                <span className="text-[11px] text-muted line-through">
                  {inr(product.mrp)}
                </span>
                <span className="text-[11px] font-bold text-emerald-600">
                  {mrpOff}% off
                </span>
              </>
            ) : null}
          </div>

          {unavailable ? (
            <Link
              href={href}
              className="mt-2 flex w-full items-center justify-center rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
            >
              View details
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={atCartLimit}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              style={{ background: theme.accent, color: theme.accentInk }}
            >
              {justAdded ? <Check size={14} /> : <ShoppingCart size={14} />}
              {justAdded
                ? "Added"
                : atCartLimit
                  ? `Max ${cartLimit} in cart`
                  : inCartQty > 0
                  ? `Add more (${inCartQty})`
                  : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
