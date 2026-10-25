"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { products as staticProducts } from "@/lib/data";
import { useStore } from "@/components/providers";
import { inr } from "@/lib/format";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react";

export default function CartPage() {
  const searchParams = useSearchParams();
  const addToOrderId = searchParams.get("addToOrder");

  const {
    cart,
    setQty,
    removeFromCart,
    toggleWishlist,
    wishlist,
  } = useStore();

  const [allProducts, setAllProducts] = useState(staticProducts);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load products",
          );
        }

        const mappedProducts = result.products.map(
          (product: any) => {
            const variant =
              product.product_variants?.find(
                (item: any) => item.active !== false,
              ) ||
              product.product_variants?.[0];

            const inventory = variant?.inventory;

            const images =
              product.product_images
                ?.map(
                  (image: any) => image.image_url,
                )
                .filter(Boolean) || [];

            const primaryImage =
              product.product_images?.find(
                (image: any) => image.is_primary,
              )?.image_url ||
              images[0] ||
              "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80";

            return {
              ...staticProducts[0],

              id: product.id,
              name: product.name,
              brand: "SundayShop", // Hardcoded brand name

              category:
                product.categories?.name?.toLowerCase() ||
                "fruits",

              subcategory:
                product.subcategory || "",

              description:
                product.description || "",

              active:
                product.active !== false,

              rating:
                Number(product.rating || 0),

              reviewCount:
                Number(product.review_count || 0),

              mrp:
                Number(variant?.mrp || 0),

              price:
                Number(
                  variant?.selling_price || 0,
                ),

              gstRate:
                Number(
                  variant?.gst_rate || 0,
                ),

              stock:
                Number(
                  inventory?.stock_quantity || 0,
                ),

              maxOrderQuantity:
                Number(
                  variant?.max_order_quantity || 5,
                ),

              deliveryEta: "Tomorrow",

              specs: {
                Unit:
                  variant?.variant_name || "",
              },

              image: primaryImage,

              images:
                images.length > 0
                  ? images
                  : [primaryImage],

              sold: 0,
              sellerId: "sundayshop",
              location: "",
              tags: [],
              highlights: [],
              moq: 1,
              tiers: [],
            };
          },
        );

        setAllProducts(mappedProducts);
      } catch (error) {
        console.error(
          "Failed to load products:",
          error,
        );

        setAllProducts([]);
      }
    }

    loadProducts();
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
    (total, row) =>
      total + row.product!.price * row.qty,
    0,
  );

  const totalMrp = rows.reduce(
    (total, row) =>
      total +
      (row.product!.mrp && row.product!.mrp > row.product!.price
        ? row.product!.mrp
        : row.product!.price) *
        row.qty,
    0,
  );

  const totalSavings = Math.max(0, totalMrp - sub);

  const ship =
    sub === 0 || sub >= 499 ? 0 : 49;

  const total = sub + ship;

  const totalItemCount = rows.reduce((sum, row) => sum + row.qty, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Top Breadcrumb / Return Navigation */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted hover:text-brand transition"
        >
          <ArrowLeft size={15} />
          <span>Continue Shopping</span>
        </Link>

        {rows.length > 0 && (
          <span className="text-xs font-semibold text-muted">
            {totalItemCount} {totalItemCount === 1 ? "item" : "items"} in cart
          </span>
        )}
      </div>

      {/* Cart Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-[2px] w-5 bg-amber-400 rounded-full" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5c6b75]">
            YOUR SHOPPING BASKET
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
          Shopping Cart
        </h1>
      </div>

      {/* Empty State */}
      {rows.length === 0 ? (
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="rounded-3xl border border-[#E9E6DC] bg-white p-8 sm:p-10 shadow-xs">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand">
              <ShoppingBag size={34} />
            </div>

            <h2 className="mt-5 text-xl sm:text-2xl font-bold text-ink">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-xs text-xs sm:text-sm leading-relaxed text-muted">
              Looks like you haven&apos;t added any groceries yet. Fill your basket with farm-fresh produce and daily essentials.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-[#f05a28] hover:bg-[#d84e1d] px-6 text-sm font-bold text-white shadow-sm transition active:scale-98"
            >
              <span>Start Shopping</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* Left Column — Cart items (approx 8 cols) */}
          <div className="space-y-4 lg:col-span-8">
            {/* Free Delivery Bar */}
            {sub < 499 ? (
              <div className="rounded-2xl border border-brand/20 bg-brand-soft/70 p-3.5 sm:p-4 text-xs sm:text-sm text-[#132029]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-brand text-white shrink-0">
                      <Truck size={14} />
                    </span>
                    <p>
                      Add <span className="font-bold text-brand">{inr(499 - sub)}</span> more to unlock <span className="font-bold text-brand">FREE delivery</span>
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-muted shrink-0 hidden sm:inline">Target: {inr(499)}</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="h-1.5 w-full rounded-full bg-line/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((sub / 499) * 100))}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 sm:p-4 text-xs sm:text-sm font-semibold text-emerald-800">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>You&apos;ve unlocked <strong>FREE delivery</strong> for this order!</span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-3">
              {rows.map((row) => {
                const product = row.product!;

                const maxOrderQuantity = Math.max(
                  1,
                  Number(
                    (product as any)
                      .maxOrderQuantity || 5,
                  ),
                );

                const currentStock = Math.max(
                  0,
                  Number(
                    (product as any).stock || 0,
                  ),
                );

                const quantityLimit = Math.min(
                  maxOrderQuantity,
                  currentStock,
                );

                const canIncrease =
                  row.qty < quantityLimit;

                const hasDiscount = product.mrp > product.price;
                const unitText = product.specs.Unit ?? product.specs.Weight ?? "Pack";

                return (
                  <div
                    key={row.productId}
                    className="rounded-2xl border border-[#E9E6DC] bg-white p-3.5 sm:p-5 shadow-2xs transition hover:border-line hover:shadow-xs"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      {/* Product Image */}
                      <Link
                        href={`/products/${product.id}`}
                        className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-line/60 bg-surface-2"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover object-center transition group-hover:scale-105"
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {product.brand && (
                              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted">
                                {product.brand}
                              </p>
                            )}

                            <Link
                              href={`/products/${product.id}`}
                              className="font-semibold text-sm sm:text-base text-ink hover:text-brand transition line-clamp-2"
                            >
                              {product.name}
                            </Link>

                            <p className="text-xs text-muted mt-0.5">
                              {unitText}
                            </p>
                          </div>

                          {/* Item Total (Desktop) */}
                          <div className="hidden sm:block text-right shrink-0">
                            <p className="text-[11px] font-medium text-muted">
                              Total
                            </p>
                            <p className="text-base font-bold text-ink">
                              {inr(product.price * row.qty)}
                            </p>
                          </div>
                        </div>

                        {/* Price Row */}
                        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                          <span className="text-base font-bold text-ink">
                            {inr(product.price)}
                          </span>

                          {hasDiscount && (
                            <>
                              <span className="text-xs text-muted line-through">
                                {inr(product.mrp)}
                              </span>
                              <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                Save {inr((product.mrp - product.price) * row.qty)}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Quantity & Actions Row */}
                        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-line/50 pt-3">
                          {/* Quantity Selector: - 1 + */}
                          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-0.5 shadow-2xs">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                setQty(
                                  row.productId,
                                  Math.max(
                                    1,
                                    row.qty - 1,
                                  ),
                                )
                              }
                              className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink active:scale-95"
                            >
                              <Minus size={13} strokeWidth={2.5} />
                            </button>

                            <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-bold text-ink select-none">
                              {row.qty}
                            </span>

                            <button
                              type="button"
                              aria-label="Increase quantity"
                              disabled={!canIncrease}
                              onClick={() => {
                                if (
                                  row.qty <
                                  quantityLimit
                                ) {
                                  setQty(
                                    row.productId,
                                    row.qty + 1,
                                  );
                                }
                              }}
                              className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Plus size={13} strokeWidth={2.5} />
                            </button>
                          </div>

                          {/* Wishlist & Remove Buttons */}
                          <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                if (!wishlist.includes(row.productId)) {
                                  toggleWishlist(row.productId);
                                }
                                removeFromCart(row.productId);
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-brand hover:underline transition"
                            >
                              <Heart
                                size={14}
                                className={wishlist.includes(row.productId) ? "fill-brand" : ""}
                              />
                              <span>Move to Wishlist</span>
                            </button>

                            <span className="h-3 w-px bg-line" />

                            <button
                              type="button"
                              onClick={() => removeFromCart(row.productId)}
                              className="inline-flex items-center gap-1 font-semibold text-muted hover:text-danger hover:underline transition"
                            >
                              <Trash2 size={14} />
                              <span>Remove</span>
                            </button>
                          </div>

                          {/* Item Total (Mobile Only) */}
                          <div className="sm:hidden w-full text-right pt-1">
                            <span className="text-xs text-muted">Item total: </span>
                            <span className="text-sm font-bold text-ink">
                              {inr(product.price * row.qty)}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Limit Notice */}
                        {row.qty >= quantityLimit && quantityLimit > 0 && (
                          <p className="mt-2 text-[11px] font-medium text-amber-700">
                            Maximum order limit reached ({quantityLimit} units)
                          </p>
                        )}

                        {currentStock === 0 && (
                          <p className="mt-2 text-[11px] font-medium text-danger">
                            Currently out of stock
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column — Order Summary (approx 4 cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-2xl sm:rounded-3xl border border-[#E9E6DC] bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-lg font-bold text-ink">
                Order Summary
              </h2>

              {/* Savings Banner */}
              {totalSavings > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/70 px-3 py-2 text-xs font-semibold text-emerald-800">
                  <Sparkles size={14} className="text-emerald-600 shrink-0" />
                  <span>You save {inr(totalSavings)} on this order</span>
                </div>
              )}

              {/* Summary Items */}
              <div className="mt-4 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-[#5c6b75]">
                  <span>Subtotal ({totalItemCount} {totalItemCount === 1 ? "item" : "items"})</span>
                  <span className="font-semibold text-ink">{inr(sub)}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span>-{inr(totalSavings)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#5c6b75]">
                  <span>Delivery</span>
                  <span>
                    {ship === 0 ? (
                      <span className="font-bold text-emerald-600">FREE</span>
                    ) : (
                      <span className="font-semibold text-ink">{inr(ship)}</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 h-px bg-line/80" />

              {/* Total Row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase font-bold tracking-wider text-muted">
                    Total
                  </p>
                  <p className="text-2xl font-extrabold text-ink">
                    {inr(total)}
                  </p>
                </div>
                {ship === 0 && (
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand">
                    Free Delivery
                  </span>
                )}
              </div>

              {/* Proceed to Checkout CTA */}
              <Link
                href={
                  addToOrderId
                    ? `/checkout?addToOrder=${addToOrderId}`
                    : "/checkout"
                }
                className="mt-5 flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#f05a28] hover:bg-[#d84e1d] text-[15px] font-bold text-white shadow-sm transition active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={17} />
              </Link>

              {/* Trust Section */}
              <div className="mt-5 pt-4 border-t border-line/60 space-y-2 text-xs text-[#5c6b75]">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 stroke-[3] shrink-0" />
                  <span>Fresh groceries</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 stroke-[3] shrink-0" />
                  <span>Reliable delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 stroke-[3] shrink-0" />
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}