
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { products } from "@/lib/data";
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
  Share2
} from "lucide-react";

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

const [product, setProduct] = useState<Product | null>(null);
const [loading, setLoading] = useState(true);
const [productReviews, setProductReviews] = useState<any[]>([]);
const [similarProducts, setSimilarProducts] = useState<any[]>([]);
const [frequentlyBoughtTogether, setFrequentlyBoughtTogether] =
  useState<any[]>([]);
const { addToCart, toggleWishlist, wishlist,user } = useStore();
const handleNotifyMe = async () => {
  if (!product?.id || notifyLoading) return;

  if (!user) {
    alert("Please log in to use Notify Me.");
    return;
  }

  setNotifyLoading(true);
  setNotifySuccess(false);

  try {
    const { data: sessionData } =
      await import("@/lib/supabase").then(
        ({ supabase }) =>
          supabase.auth.getSession(),
      );

    const accessToken =
      sessionData.session?.access_token;

    if (!accessToken) {
      alert("Please log in again to use Notify Me.");
      return;
    }

    const response = await fetch(
      "/api/notifications/back-in-stock",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId: product.id,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ||
          "Unable to save notification request.",
      );
    }

    setNotifySuccess(true);
  } catch (error) {
    console.error(
      "Notify Me error:",
      error,
    );

    alert(
      error instanceof Error
        ? error.message
        : "Unable to request a notification.",
    );
  } finally {
    setNotifyLoading(false);
  }
};
const handleBuyNow = () => {
  if (!product || product.stock <= 0) return;

  addToCart(product.id, qty);

  window.location.href = "/checkout";
};
const handleShare = async () => {
  if (!product) return;

  const shareData = {
    title: product.name,
    text: `Check out ${product.name} on SundayShop.`,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    alert("Product link copied to clipboard.");
  } catch (error) {
    console.error("Share failed:", error);
  }
};
const [qty, setQty] = useState(1);
const [notifyLoading, setNotifyLoading] = useState(false);
const [notifySuccess, setNotifySuccess] = useState(false);
const [img, setImg] = useState(0);

useEffect(() => {
  async function loadProduct() {
    try {
      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load product",
        );
      }

      const found = result.products.find(
        (item: any) => item.id === id,
      );

      if (!found) {
        setProduct(null);
        return;
      }

      const variant =
        found.product_variants?.find(
          (item: any) => item.active !== false,
        ) || found.product_variants?.[0];

      const inventory = variant?.inventory;

      const images =
        found.product_images
          ?.map((image: any) => image.image_url)
          .filter(Boolean) || [];

      const primaryImage =
        found.product_images?.find(
          (image: any) => image.is_primary,
        )?.image_url ||
        images[0] ||
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80";

      const mappedProduct: Product = {
        ...products[0],

        id: found.id,
        name: found.name,
        brand: "SundayShop",
        category:
          found.categories?.name?.toLowerCase() || "fruits",
        subcategory: found.subcategory || "",

        description: found.description || "",

        active: found.active !== false,

        rating: Number(found.rating || 0),
        reviewCount: Number(found.review_count || 0),

        mrp: Number(variant?.mrp || 0),
        price: Number(variant?.selling_price || 0),
        gstRate: Number(variant?.gst_rate || 0),

        stock: Number(
          inventory?.stock_quantity || 0,
        ),

        deliveryEta: "Tomorrow",

        specs: {
          Unit: variant?.variant_name || "",
        },

        image: primaryImage,
        images:
          images.length > 0
            ? images
            : [primaryImage],

        sold: 0,
        sellerId: "SundayShop",
        location: "",
        tags: [],
        highlights: [],
        moq: 1,
        tiers: [],
      };

      setProduct(mappedProduct);
      setQty(mappedProduct.moq ?? 1);
      setImg(0);
    } catch (error) {
      console.error(
        "Failed to load product:",
        error,
      );

      setProduct(null);
    } finally {
      setLoading(false);
    }
  }

  loadProduct();
}, [id]);
useEffect(() => {
  if (!product?.id) return;

  const loadReviews = async () => {
    try {
      const response = await fetch(
        `/api/reviews?productId=${encodeURIComponent(product.id)}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) return;

      const data = await response.json();

const mappedReviews = (data.reviews ?? []).map(
  (review: any) => ({
    id: review.id,
    rating: review.rating,
    title: review.title || "Customer review",
    author: review.customer_name,
    city: "",
    date: new Date(review.created_at).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    ),
    body: review.body,
    verified: review.verified,
  }),
);

setProductReviews(mappedReviews);
    } catch {
      setProductReviews([]);
    }
  };

  loadReviews();
}, [product?.id]);
useEffect(() => {
  if (!user?.id || !product?.id) {
    return;
  }

  fetch("/api/customer/activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerId: user.id,
      productId: product.id,
      activityType: "view",
    }),
  }).catch((error) => {
    console.error(
      "Failed to record product view:",
      error,
    );
  });
}, [user?.id, product?.id]);
useEffect(() => {
  if (!product?.id) {
    return;
  }

  const loadSimilarProducts = async () => {
    try {
      const response = await fetch(
        `/api/recommendations/similar?productId=${encodeURIComponent(
          product.id,
        )}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setSimilarProducts(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      console.error(
        "Failed to load similar products:",
        error,
      );

      setSimilarProducts([]);
    }
  };

  loadSimilarProducts();
}, [product?.id]);
useEffect(() => {
  if (!product?.id) {
    return;
  }

  const loadFrequentlyBoughtTogether = async () => {
    try {
      const response = await fetch(
        `/api/recommendations/frequently-bought-together?productId=${encodeURIComponent(
          product.id,
        )}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        setFrequentlyBoughtTogether([]);
        return;
      }

      const data = await response.json();

      setFrequentlyBoughtTogether(
        Array.isArray(data) ? data : [],
      );
    } catch (error) {
      console.error(
        "Failed to load frequently bought together products:",
        error,
      );

      setFrequentlyBoughtTogether([]);
    }
  };

  loadFrequentlyBoughtTogether();
}, [product?.id]);
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

         {/* Category + wishlist/share */}
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

  <div className="flex shrink-0 items-center gap-3">
    <button
      onClick={() => toggleWishlist(product.id)}
      aria-label={
        wishlist.includes(product.id)
          ? "Remove from wishlist"
          : "Add to wishlist"
      }
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface transition hover:border-cta hover:bg-cta-soft"
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

    <Button
      variant="outline"
      onClick={handleShare}
      className="h-11"
    >
      <Share2 size={16} />
      Share
    </Button>
  </div>
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

         {/* Quantity + Add to cart / Notify Me */}
<div className="mt-6">
  {product.stock > 0 ? (
    <>
      <label className="mb-1.5 block text-sm font-medium">
        Quantity
      </label>

      <div className="flex flex-wrap gap-3">
        <div className="flex h-12 items-center overflow-hidden rounded-xl border border-line bg-surface">
          <button
            onClick={() =>
              setQty(
                Math.max(
                  product.moq ?? 1,
                  qty - 1,
                ),
              )
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
              const value = Number(
                event.target.value,
              );

              setQty(
                Math.max(
                  product.moq ?? 1,
                  Number.isNaN(value)
                    ? 1
                    : value,
                ),
              );
            }}
            className="h-full w-14 border-x border-line bg-transparent text-center text-sm outline-none"
          />

          <button
            onClick={() => setQty(Math.min(5, qty + 1))}
            className="h-full w-11 text-lg hover:bg-surface-2"
          >
            +
          </button>
        </div>
<div className="flex flex-1 flex-col gap-3 sm:flex-row">
    <Button
      variant="outline"
     onClick={handleBuyNow}
     className="h-12 flex-1 sm:px-8"
  >
    Buy Now
     </Button>
        <Button
          variant="cta"
          onClick={() =>
            addToCart(product.id, qty)
          }
          className="h-12 flex-1 sm:flex-none sm:px-10"
        >
          <ShoppingCart size={17} />
          Add to cart
        </Button>
      </div>
      </div>
    </>
  ) : (
    <div className="rounded-2xl border border-line bg-surface-2 p-5">
      <p className="text-sm font-semibold">
        Currently out of stock
      </p>

      <p className="mt-1 text-sm text-muted">
        Get notified when this product is available again.
      </p>

      <Button
        variant="cta"
        onClick={handleNotifyMe}
        disabled={notifyLoading || notifySuccess}
        className="mt-4 h-12 w-full sm:w-auto sm:px-10"
      >
        {notifyLoading
          ? "Saving..."
          : notifySuccess
            ? "✓ You'll be notified"
            : "Notify Me"}
      </Button>
    </div>
  )}
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
  No reviews yet for this product. Be the first one to write a review.
</p>
            )}

          </div>
        </Card>
      </div>

      {similarProducts.length > 0 && (
        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold">
              You May Also Like
            </h2>

            <p className="mt-1 text-sm text-muted">
              Similar products you might be interested in.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {similarProducts.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.id}`}
                className="group"
              >
                <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="aspect-square overflow-hidden bg-surface-2">
                    {item.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-xs font-medium capitalize text-brand">
                      {item.category}
                    </p>

                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold">
                      {item.name}
                    </h3>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-bold">
                        {inr(item.price)}
                      </span>

                      {item.mrp > item.price && (
                        <span className="text-xs text-muted line-through">
                          {inr(item.mrp)}
                        </span>
                      )}
                    </div>

                    {item.mrp > item.price && (
                      <p className="mt-1 text-xs font-medium text-cta">
                        Save {inr(item.mrp - item.price)}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
      {frequentlyBoughtTogether.length > 0 && (
  <section className="mt-12">
    <div className="mb-5">
      <h2 className="text-2xl font-semibold">
        Frequently Bought Together
      </h2>
      <p className="mt-1 text-sm text-muted">
        Products customers often buy with this item.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {frequentlyBoughtTogether.map((item) => (
        <Link
          key={item.id}
          href={`/products/${item.id}`}
          className="group"
        >
          <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="aspect-square overflow-hidden bg-surface-2">
              {item.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted">
                  No image
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="text-xs font-medium capitalize text-brand">
                {item.category}
              </p>

              <h3 className="mt-1 line-clamp-2 text-sm font-semibold">
                {item.name}
              </h3>

              <div className="mt-3 flex items-center gap-2">
                <span className="font-bold">
                  {inr(item.price)}
                </span>

                {item.mrp > item.price && (
                  <span className="text-xs text-muted line-through">
                    {inr(item.mrp)}
                  </span>
                )}
              </div>

              {item.mrp > item.price && (
                <p className="mt-1 text-xs font-medium text-cta">
                  Save {inr(item.mrp - item.price)}
                </p>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  </section>
)}
    </div>
  );
}
      