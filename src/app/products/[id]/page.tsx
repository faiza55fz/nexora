
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { products, reviews } from "@/lib/data";
type Product = (typeof products)[number] & {
  active?: boolean;
};
import { useStore } from "@/components/providers";
import { Badge, Button, Card } from "@/components/ui";
import { Stars } from "@/components/product-card";
import { discountPct, inr } from "@/lib/format";
import {
  Heart,
  MapPin,
  ShieldCheck,
  Truck,
  ChevronRight,
  CheckCircle2,
  PackageCheck,
  Leaf,
  ShoppingCart,
} from "lucide-react";

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

const [product, setProduct] = useState<Product | null>(null);
const [loading, setLoading] = useState(true);

const { addToCart, toggleWishlist, wishlist } = useStore();

const [qty, setQty] = useState(1);
const [img, setImg] = useState(0);

useEffect(() => {
  const saved = localStorage.getItem(
    "nexora-admin-products",
  );

  if (saved) {
    try {
      const savedProducts = JSON.parse(saved);

      if (Array.isArray(savedProducts)) {
        const found = savedProducts.find(
          (item: Product) => item.id === id,
        );

        if (found) {
          setProduct({
            ...found,
            active: found.active !== false,
          });

          setQty(found.moq ?? 1);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall back to the original catalog.
    }
  }

  const fallback = products.find(
    (item) => item.id === id,
  );

  if (fallback) {
    setProduct({
      ...fallback,
      active: true,
    });

    setQty(fallback.moq ?? 1);
  }

  setLoading(false);
}, [id]);
if (loading) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center">
      <p className="text-sm text-muted">
        Loading product…
      </p>
    </div>
  );
}

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <PackageCheck className="mx-auto mb-4 text-muted" size={42} />

        <h1 className="text-2xl font-semibold">
          Product not found
        </h1>

        <p className="mt-2 text-sm text-muted">
          This product may no longer be available.
        </p>

        <Link
          href="/products"
          className="mt-5 inline-block font-semibold text-brand"
        >
          Continue shopping
        </Link>
      </div>
    );
  }
if (product.active === false) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-center">
      <PackageCheck
        className="mx-auto mb-4 text-muted"
        size={42}
      />

      <h1 className="text-2xl font-semibold">
        Product currently unavailable
      </h1>

      <p className="mt-2 text-sm text-muted">
        This product is temporarily unavailable.
        Please check back later or browse other groceries.
      </p>

      <Link
        href="/products"
        className="mt-5 inline-block font-semibold text-brand"
      >
        Continue shopping
      </Link>
    </div>
  );
}
  const off = discountPct(product.mrp, product.price);

  const productReviews = reviews.filter(
    (review) => review.productId === product.id,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-16">

  <Link
    href="/products"
    className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-brand"
  >
    ← Back to groceries
  </Link>

  {/* Breadcrumb */}
  <div className="mb-6 flex items-center gap-1 text-sm text-muted">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>

        <ChevronRight size={14} />

        <Link href="/products" className="hover:text-brand">
          Groceries
        </Link>

        <ChevronRight size={14} />

        <span className="truncate text-foreground">
          {product.name}
        </span>
      </div>

      {/* Main product section */}
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">

        {/* Product images */}
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-line bg-surface">

            {off > 0 && (
              <div className="absolute left-4 top-4 z-10 rounded-full bg-cta px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                {off}% OFF
              </div>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images[img] ?? product.image}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>

          {/* Image thumbnails */}
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto">
              {product.images.map((src, index) => (
                <button
                  key={src}
                  onClick={() => setImg(index)}
                  aria-label={`View product image ${index + 1}`}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-surface transition ${
                    index === img
                      ? "border-brand shadow-sm"
                      : "border-line hover:border-brand/40"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Trust strip */}
          <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface">

            <div className="flex flex-col items-center gap-1.5 p-3 text-center">
              <Leaf size={18} className="text-brand" />
              <span className="text-xs font-medium">
                Fresh products
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5 p-3 text-center">
              <Truck size={18} className="text-brand" />
              <span className="text-xs font-medium">
                1-day delivery
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5 p-3 text-center">
              <ShieldCheck size={18} className="text-brand" />
              <span className="text-xs font-medium">
                Quality checked
              </span>
            </div>

          </div>
        </div>

        {/* Product information */}
        <div>

          {/* Category + wishlist */}
          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-sm font-medium capitalize text-brand">
                {product.category}
              </p>

              <p className="mt-1 text-sm text-muted">
                {product.brand} · {product.subcategory}
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {product.name}
              </h1>
            </div>

            <button
              onClick={() => toggleWishlist(product.id)}
              aria-label="Add to wishlist"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface transition hover:border-cta hover:bg-cta-soft"
            >
              <Heart
                size={20}
                className={
                  wishlist.includes(product.id)
                    ? "fill-cta text-cta"
                    : "text-muted"
                }
              />
            </button>

          </div>

          {/* Rating */}
          <div className="mt-4 flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-2">
              <Stars value={product.rating} />
              <span className="font-semibold">
                {product.rating}
              </span>
            </div>

            <span className="text-sm text-muted">
              {product.reviewCount.toLocaleString("en-IN")} reviews
            </span>

          </div>

          <div className="my-5 h-px bg-line" />

          {/* Price */}
          <div className="flex flex-wrap items-end gap-3">

            <span className="text-4xl font-bold">
              {inr(product.price)}
            </span>

            {product.mrp > product.price && (
              <span className="pb-1 text-lg text-muted line-through">
                {inr(product.mrp)}
              </span>
            )}

            {off > 0 && (
              <Badge tone="cta">
                Save {inr(product.mrp - product.price)}
              </Badge>
            )}

          </div>

          <p className="mt-1 text-sm text-muted">
            Inclusive of all applicable taxes
          </p>

          {/* Highlights */}
          <div className="mt-6 rounded-2xl bg-surface-2 p-4">

            <p className="mb-3 text-sm font-semibold">
              Why you'll love it
            </p>

            <ul className="space-y-2.5">
              {product.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-2 text-sm"
                >
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-brand"
                  />

                  <span>{highlight}</span>
                </li>
              ))}
            </ul>

          </div>

          {/* Quantity + Add to cart */}
          <div className="mt-6">

            <label className="mb-1.5 block text-sm font-medium">
              Quantity
            </label>

            <div className="flex flex-wrap gap-3">

              <div className="flex h-12 items-center overflow-hidden rounded-xl border border-line bg-surface">

                <button
                  onClick={() =>
                    setQty(Math.max(product.moq ?? 1, qty - 1))
                  }
                  className="h-full w-11 text-lg hover:bg-surface-2"
                >
                  −
                </button>

                <input
                  type="number"
                  min={product.moq ?? 1}
                  value={qty}
                  onChange={(event) => {
                    const value = Number(event.target.value);

                    setQty(
                      Math.max(
                        product.moq ?? 1,
                        Number.isNaN(value) ? 1 : value,
                      ),
                    );
                  }}
                  className="h-full w-14 border-x border-line bg-transparent text-center text-sm outline-none"
                />

                <button
                  onClick={() => setQty(qty + 1)}
                  className="h-full w-11 text-lg hover:bg-surface-2"
                >
                  +
                </button>

              </div>

              <Button
                variant="cta"
                onClick={() => addToCart(product.id, qty)}
                className="h-12 flex-1 sm:flex-none sm:px-10"
              >
                <ShoppingCart size={17} />
                Add to cart
              </Button>

            </div>

          </div>

          {/* Delivery information */}
          <div className="mt-6 space-y-3">

            <div className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
              <Truck
                className="mt-0.5 shrink-0 text-brand"
                size={20}
              />

              <div>
                <p className="text-sm font-semibold">
                  {product.deliveryEta}
                </p>

                <p className="mt-0.5 text-xs text-muted">
                  Fresh groceries delivered to your doorstep.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
              <MapPin
                className="mt-0.5 shrink-0 text-brand"
                size={20}
              />

              <div>
                <p className="text-sm font-semibold">
                  Available near you
                </p>

                <p className="mt-0.5 text-xs text-muted">
                  {product.location}
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
              <ShieldCheck
                className="mt-0.5 shrink-0 text-brand"
                size={20}
              />

              <div>
                <p className="text-sm font-semibold">
                  Cash on delivery available
                </p>

                <p className="mt-0.5 text-xs text-muted">
                  Pay when your groceries arrive.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Product details + reviews */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2">

        {/* Specifications */}
        <Card className="p-6">

          <h2 className="text-xl font-semibold">
            Product details
          </h2>

          <dl className="mt-5 divide-y divide-line">

            {Object.entries(product.specs).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-2 gap-4 py-3 text-sm"
                >
                  <dt className="text-muted">
                    {key}
                  </dt>

                  <dd className="font-medium">
                    {value}
                  </dd>
                </div>
              ),
            )}

          </dl>
        </Card>

        {/* Reviews */}
        <Card className="p-6">

          <div className="flex items-center justify-between gap-3">

            <div>
              <h2 className="text-xl font-semibold">
                Customer reviews
              </h2>

              <p className="mt-1 text-sm text-muted">
                {product.reviewCount.toLocaleString("en-IN")} reviews
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Stars value={product.rating} />
              <span className="font-semibold">
                {product.rating}
              </span>
            </div>

          </div>

          <div className="mt-5 space-y-5">

            {productReviews.length ? (
              productReviews.map((review) => (
                <div
                  key={review.id}
                  className="border-t border-line pt-5 first:border-t-0 first:pt-0"
                >

                  <div className="flex items-center gap-2">
                    <Stars value={review.rating} />

                    {review.verified ? (
                      <span className="text-xs font-medium text-brand">
                        Verified purchase
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 font-medium">
                    {review.title}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {review.author}, {review.city} · {review.date}
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    {review.body}
                  </p>

                </div>
              ))
            ) : (
              <p className="text-sm text-muted">
                No reviews yet for this product.
              </p>
            )}

          </div>
        </Card>

      </div>
    </div>
  );
}
