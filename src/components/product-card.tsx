"use client";

import { useState } from "react";
import Link from "next/link";
import { GitCompare, Heart, ShoppingCart, Star } from "lucide-react";
import { Badge } from "@/components/ui";
import { useStore } from "@/components/providers";
import { discountPct, inr, wholesalePrice } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product & {
    variantId?: string;
    maxOrderQuantity?: number;
  };
  addToOrderMode?: boolean;
};

export function Stars({
  value,
  size = 14,
}: {
  value: number;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-amber-500"
      aria-label={`${value} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i + 1 <= Math.round(value) ? "fill-current" : "opacity-30"
          }
        />
      ))}
    </span>
  );
}

export function ProductCard({
  product,
  addToOrderMode = false,
}: ProductCardProps) {
  const {
    mode,
    addToCart,
    addToExistingOrder,
    existingOrderItems,
    toggleWishlist,
    toggleCompare,
    wishlist,
    compare,
  } = useStore();

  const saved = wishlist.includes(product.id);
  const compared = compare.includes(product.id);

  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySaved, setNotifySaved] = useState(false);

  const unit =
    mode === "b2b"
      ? wholesalePrice(product.tiers, product.moq)
      : product.price;

  const off = discountPct(product.mrp, unit);

  const isUnavailable = product.active === false;
  const isOutOfStock = product.stock <= 0;
  const unavailable = isUnavailable || isOutOfStock;

  const existingOrderItem = existingOrderItems.find(
    (item) => item.variantId === product.variantId,
  );

  async function handleNotify() {
    if (notifyLoading || notifySaved) return;

    setNotifyLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in to get notified when this product is available.");
        return;
      }

      const { error } = await supabase
        .from("product_stock_notifications")
        .insert({
          product_id: product.id,
          customer_id: user.id,
        });

      if (error) {
        if (error.code === "23505") {
          setNotifySaved(true);
          return;
        }

        throw error;
      }

      setNotifySaved(true);
    } catch (error) {
      console.error("Notification request failed:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setNotifyLoading(false);
    }
  }

  function handleAddToExistingOrder() {
    if (!product.variantId) {
      alert("This product is not available right now.");
      return;
    }

    addToExistingOrder({
      productId: product.id,
      variantId: product.variantId,
      name: product.name,
      price: unit,
      quantity: 1,
      maxQuantity: Math.min(
        product.maxOrderQuantity ?? 5,
        product.stock,
      ),
    });
  }

  const unitSize =
    product.specs?.Unit ||
    (product.specs as Record<string, string>)?.Weight ||
    (product.specs as Record<string, string>)?.Pack ||
    product.subcategory ||
    "";

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-2.5 sm:p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-2">
        <Link
          href={`/products/${product.id}`}
          className="block h-full w-full"
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {off > 0 ? (
          <div className="absolute left-2 top-2 pointer-events-none">
            <span className="rounded-md bg-cta px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-white shadow-xs">
              {off}% OFF
            </span>
          </div>
        ) : null}

        {mode === "b2b" ? (
          <div className="absolute left-2 bottom-2 pointer-events-none">
            <span className="rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Bulk
            </span>
          </div>
        ) : null}

        {/* Wishlist button */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform active:scale-90 ${
            saved
              ? "text-red-500"
              : "text-muted hover:text-red-500"
          }`}
        >
          <Heart
            size={14}
            className={saved ? "fill-red-500 text-red-500" : ""}
          />
        </button>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between pt-2">
        <div>
          {/* Brand & Unit */}
          <div className="flex items-center justify-between gap-1 text-[11px] leading-tight">
            <span className="truncate font-medium uppercase tracking-wider text-muted">
              {product.brand || "SundayShop"}
            </span>

            {unitSize ? (
              <span className="shrink-0 font-medium text-ink/75">
                {unitSize}
              </span>
            ) : null}
          </div>

          {/* Product Name */}
          <Link
            href={`/products/${product.id}`}
            className="mt-1 block line-clamp-2 min-h-[2.4rem] text-xs sm:text-sm font-semibold leading-snug text-ink transition hover:text-brand"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Rating */}
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <Star size={11} className="fill-current text-amber-500" />
              {product.rating ? Number(product.rating).toFixed(1) : "4.5"}
            </span>

            {product.reviewCount ? (
              <span className="text-[10px] text-muted truncate">
                ({product.reviewCount})
              </span>
            ) : null}
          </div>
        </div>

        {/* Price & Add Section */}
        <div className="mt-2.5 border-t border-line/60 pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-bold text-ink">
              {inr(unit)}
            </span>

            {product.mrp > unit ? (
              <span className="text-xs text-muted line-through">
                {inr(product.mrp)}
              </span>
            ) : null}
          </div>

          <div className="mt-2">
            {unavailable ? (
              <button
                type="button"
                onClick={handleNotify}
                disabled={notifyLoading || notifySaved}
                className="w-full rounded-xl border border-line bg-surface-2 px-2 py-1.5 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand disabled:cursor-default disabled:opacity-70"
              >
                {notifyLoading
                  ? "Saving..."
                  : notifySaved
                    ? "You'll be notified"
                    : "Notify me"}
              </button>
            ) : addToOrderMode ? (
              <button
                type="button"
                onClick={handleAddToExistingOrder}
                disabled={
                  !product.variantId ||
                  Boolean(
                    existingOrderItem &&
                      existingOrderItem.quantity >=
                        existingOrderItem.maxQuantity,
                  )
                }
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-2 py-1.5 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShoppingCart size={14} />
                {existingOrderItem
                  ? existingOrderItem.quantity >=
                    existingOrderItem.maxQuantity
                    ? "Limit reached"
                    : "Add more"
                  : "Add to order"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  addToCart(
                    product.id,
                    mode === "b2b" ? product.moq : 1,
                  )
                }
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand/30 bg-brand-soft px-3 py-1.5 text-xs sm:text-sm font-bold text-brand transition-all hover:bg-brand hover:text-white active:scale-98"
              >
                <ShoppingCart size={14} />
                ADD
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}