"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { products as staticProducts } from "@/lib/data";
import { useStore } from "@/components/providers";
import { Button, Card } from "@/components/ui";
import { inr } from "@/lib/format";
import {
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  ShieldCheck,
  Tag,
} from "lucide-react";

export default function CartPage() {
  const { cart, setQty, removeFromCart } = useStore();

  const [allProducts, setAllProducts] = useState(staticProducts);

  useEffect(() => {
    try {
      const savedProducts =
        localStorage.getItem("nexora-admin-products");

      if (savedProducts) {
        const adminProducts = JSON.parse(savedProducts);

        if (Array.isArray(adminProducts)) {
          setAllProducts(adminProducts);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load admin products:",
        error,
      );
    }
  }, []);

  const rows = cart
    .map((item) => ({
      ...item,
      product: allProducts.find(
        (product) => product.id === item.productId,
      ),
    }))
    .filter((row) => row.product);

  const sub = rows.reduce(
    (total, row) => total + row.product!.price * row.qty,
    0,
  );

  const ship = sub === 0 || sub >= 499 ? 0 : 49;
  const total = sub + ship;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-16">
      <Link
        href="/products"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-brand"
      >
        ← Go back
      </Link>

      {/* Header */}
      <div className="mb-7">
        <p className="text-sm font-medium text-brand">
          Your shopping bag
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Cart
        </h1>

        {rows.length > 0 && (
          <p className="mt-1 text-sm text-muted">
            {rows.length}{" "}
            {rows.length === 1 ? "item" : "items"} ready for checkout
          </p>
        )}
      </div>

      {/* Empty cart */}
      {rows.length === 0 ? (
        <Card className="mx-auto max-w-lg p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft">
            <ShoppingBag size={28} className="text-brand" />
          </div>

          <h2 className="mt-5 text-xl font-semibold">
            Your cart is empty
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            Looks like you haven't added anything yet. Explore fresh
            groceries and everyday essentials.
          </p>

          <Link href="/products">
            <Button variant="cta" className="mt-6">
              Start shopping
              <ArrowRight size={17} />
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Cart items */}
            <div className="space-y-3">
              {rows.map((row) => {
                const product = row.product!;

                return (
                  <Card
                    key={row.productId}
                    className="overflow-hidden p-4 sm:p-5"
                  >
                    <div className="flex gap-4">
                      {/* Product image */}
                      <Link
                        href={`/products/${product.id}`}
                        className="shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-24 w-24 rounded-2xl object-cover sm:h-28 sm:w-28"
                        />
                      </Link>

                      {/* Product info */}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${product.id}`}
                          className="font-semibold hover:text-brand"
                        >
                          {product.name}
                        </Link>

                        <p className="mt-1 text-xs text-muted">
                          {product.brand}
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {inr(product.price)}
                          <span className="ml-1 font-normal text-muted">
                            /{" "}
                            {product.specs.Unit ??
                              product.specs.Weight ??
                              "pack"}
                          </span>
                        </p>

                        {/* Quantity */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex h-9 items-center overflow-hidden rounded-lg border border-line">
                            <button
                              aria-label="Decrease quantity"
                              onClick={() =>
                                setQty(
                                  row.productId,
                                  Math.max(1, row.qty - 1),
                                )
                              }
                              className="flex h-full w-9 items-center justify-center hover:bg-surface-2"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="flex h-full w-9 items-center justify-center border-x border-line text-sm font-medium">
                              {row.qty}
                            </span>

                            <button
                              aria-label="Increase quantity"
                              onClick={() =>
                                setQty(
                                  row.productId,
                                  row.qty + 1,
                                )
                              }
                              className="flex h-full w-9 items-center justify-center hover:bg-surface-2"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() =>
                              removeFromCart(row.productId)
                            }
                            className="flex items-center gap-1.5 text-xs font-medium text-danger hover:underline"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Item total */}
                      <div className="hidden text-right sm:block">
                        <p className="font-semibold">
                          {inr(product.price * row.qty)}
                        </p>
                      </div>
                    </div>

                    {/* Mobile item total */}
                    <div className="mt-3 flex justify-end border-t border-line pt-3 sm:hidden">
                      <p className="text-sm font-semibold">
                        Item total: {inr(product.price * row.qty)}
                      </p>
                    </div>
                  </Card>
                );
              })}

              {/* Free delivery message */}
              {sub < 499 ? (
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-brand-soft p-4 text-sm">
                  <Truck size={19} className="shrink-0 text-brand" />

                  <p>
                    Add{" "}
                    <span className="font-semibold">
                      {inr(499 - sub)}
                    </span>{" "}
                    more to get{" "}
                    <span className="font-semibold text-brand">
                      FREE delivery
                    </span>
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-brand-soft p-4 text-sm text-brand">
                  <CheckCircle2 size={19} />

                  <span className="font-medium">
                    You've unlocked FREE delivery!
                  </span>
                </div>
              )}
            </div>

            {/* Summary */}
            <div>
              <Card className="sticky top-24 p-5 sm:p-6">
                <h2 className="text-lg font-semibold">
                  Order summary
                </h2>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">
                      Subtotal
                    </span>

                    <span>{inr(sub)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted">
                      Delivery
                    </span>

                    <span>
                      {ship === 0 ? (
                        <span className="font-medium text-brand">
                          Free
                        </span>
                      ) : (
                        inr(ship)
                      )}
                    </span>
                  </div>
                </div>

                <div className="my-5 h-px bg-line" />

                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    Total
                  </span>

                  <span className="text-xl font-bold">
                    {inr(total)}
                  </span>
                </div>

                <Link href="/checkout">
                  <Button
                    variant="cta"
                    className="mt-5 w-full"
                  >
                    Proceed to checkout
                    <ArrowRight size={17} />
                  </Button>
                </Link>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
                  <ShieldCheck size={14} />
                  Secure checkout · Cash on delivery
                </div>
              </Card>

              {/* Benefits */}
              <div className="mt-4 grid gap-2">
                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                  <Truck size={17} className="text-brand" />

                  <div>
                    <p className="text-xs font-semibold">
                      1-day delivery
                    </p>

                    <p className="text-[11px] text-muted">
                      Fresh groceries at your doorstep
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                  <Tag size={17} className="text-brand" />

                  <div>
                    <p className="text-xs font-semibold">
                      Everyday low prices
                    </p>

                    <p className="text-[11px] text-muted">
                      Great value on your essentials
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}