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

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-surface-2"
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        {off > 0 ? (
          <div className="absolute left-3 top-3">
            <Badge>{off}% OFF</Badge>
          </div>
        ) : null}

        {mode === "b2b" ? (
          <div className="absolute right-3 top-3">
            <Badge>Bulk</Badge>
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {product.brand}
            </p>

            <Link
              href={`/products/${product.id}`}
              className="mt-1 block font-semibold text-foreground transition hover:text-brand"
            >
              {product.name}
            </Link>
          </div>

          <Stars value={product.rating} />
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground">
            {inr(unit)}
          </span>

          {product.mrp > unit ? (
            <span className="text-sm text-muted line-through">
              {inr(product.mrp)}
            </span>
          ) : null}
        </div>

        {unavailable ? (
          <p className="mt-3 text-sm font-medium text-muted">
            {isUnavailable ? "Currently unavailable" : "Out of stock"}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          {unavailable ? (
            <button
              type="button"
              onClick={handleNotify}
              disabled={notifyLoading || notifySaved}
              className="flex-1 rounded-xl border border-line px-3 py-2 text-sm font-semibold transition hover:border-brand disabled:cursor-default disabled:opacity-70"
            >
              {notifyLoading
                ? "Saving..."
                : notifySaved
                  ? "You'll be notified"
                  : "Notify me when available"}
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
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingCart size={16} />

              {existingOrderItem
                ? existingOrderItem.quantity >=
                  existingOrderItem.maxQuantity
                  ? "Limit reached"
                  : "Added · Add more"
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
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <ShoppingCart size={16} />
              Add
            </button>
          )}

          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-label={
              saved ? "Remove from wishlist" : "Add to wishlist"
            }
            className={`rounded-xl border p-2 transition ${
              saved
                ? "border-brand text-brand"
                : "border-line text-muted hover:text-brand"
            }`}
          >
            <Heart
              size={17}
              className={saved ? "fill-current" : ""}
            />
          </button>

          <button
            type="button"
            onClick={() => toggleCompare(product.id)}
            aria-label={
              compared ? "Remove from compare" : "Add to compare"
            }
            className={`rounded-xl border p-2 transition ${
              compared
                ? "border-brand text-brand"
                : "border-line text-muted hover:text-brand"
            }`}
          >
            <GitCompare size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}