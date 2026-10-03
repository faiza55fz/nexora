"use client";

import Link from "next/link";
import { categories, products as defaultProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import RecommendedProducts from "@/components/recommended-products";
import FamilyGroceryPackage from "@/components/family-grocery-package";
import { Badge, Button } from "@/components/ui";
import { useStore } from "@/components/providers";
import { useEffect, useState } from "react";

type CatalogProduct = (typeof defaultProducts)[number] & {
  active?: boolean;
};

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  minimum_order_value: number | null;
  maximum_discount: number | null;
  expires_at: string | null;
  first_order_only: boolean;
};

export default function HomePage() {
  const { user } = useStore();

  const [catalogProducts, setCatalogProducts] =
    useState<CatalogProduct[]>([]);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState("");

  useEffect(() => {
    async function loadCatalog() {
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

        const mappedProducts: CatalogProduct[] =
          result.products.map((product: any) => {
            const variant =
              product.product_variants?.find(
                (item: any) => item.active !== false,
              ) || product.product_variants?.[0];

            const inventory = variant?.inventory;

            const primaryImage =
              product.product_images?.find(
                (image: any) => image.is_primary,
              )?.image_url ||
              product.product_images?.[0]?.image_url ||
              "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80";

            return {
              ...defaultProducts[0],

              id: product.id,
              name: product.name,
              brand: product.brand || "",

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

              deliveryEta:
                "Tomorrow",

              specs: {
                Unit:
                  variant?.variant_name || "",
              },

              image:
                primaryImage,

              images:
                product.product_images?.map(
                  (image: any) =>
                    image.image_url,
                ) || [],

              sold: 0,
              sellerId: "SundayShop",
              location: "",
              tags: [],
              highlights: [],
              moq: 1,
              tiers: [],
            };
          });

        setCatalogProducts(mappedProducts);
      } catch (error) {
        console.error(
          "Failed to load products:",
          error,
        );

        setCatalogProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadCatalog();
  }, []);

  useEffect(() => {
    async function loadCoupons() {
      try {
        const response = await fetch("/api/coupons", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Unable to load offers.",
          );
        }

        setCoupons(result.coupons ?? []);
      } catch (error) {
        console.error(
          "Failed to load coupons:",
          error,
        );

        setCoupons([]);
      } finally {
        setLoadingCoupons(false);
      }
    }

    loadCoupons();
  }, []);

  function formatCouponDiscount(coupon: Coupon) {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}% OFF`;
    }

    return `₹${coupon.discount_value} OFF`;
  }

  function formatCouponExpiry(value: string | null) {
    if (!value) return "No expiry";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }

  async function copyCoupon(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCoupon(code);

      window.setTimeout(() => {
        setCopiedCoupon("");
      }, 1800);
    } catch (error) {
      console.error(
        "Failed to copy coupon:",
        error,
      );
    }
  }

  const activeProducts =
    catalogProducts.filter(
      (product) =>
        product.active !== false,
    );

  const deals = activeProducts
    .filter(
      (p) =>
        p.mrp > p.price &&
        ((p.mrp - p.price) / p.mrp) * 100 >= 10,
    )
    .slice(0, 8);

  const best = [...activeProducts]
    .sort(
      (a, b) =>
        b.sold - a.sold,
    )
    .slice(0, 8);

  const featured =
    activeProducts.slice(0, 8);

  // -------------------------
  // LANDING PAGE
  // -------------------------
  if (!user) {
    return (
      <main className="min-h-screen bg-bg">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:pt-10 lg:pt-14">
          <div className="relative overflow-hidden rounded-[2rem] bg-brand px-6 py-10 text-white shadow-[var(--shadow)] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 right-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

            <div className="relative max-w-3xl">
              <Badge tone="ai">
                Fresh groceries • Better prices
              </Badge>

              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Fresh groceries.
                <br />
                Low prices.
                <br />
                Delivered fast.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
                Shop fresh fruits, vegetables and everyday
                essentials at prices made for everyday shopping.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Start shopping
                  </Button>
                </Link>

                <Link
                  href="/products"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.98]"
                >
                  Explore groceries
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75">
                <span>✓ Fresh products</span>
                <span>✓ Everyday prices</span>
                <span>✓ Fast delivery</span>
              </div>
            </div>
          </div>
        </section>

        {/* USP */}
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:pt-8">
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
                title: "Fast delivery",
                text: "Get your everyday groceries without the long wait.",
              },
              {
                icon: "💵",
                title: "Cash on delivery",
                text: "Order first and pay when it arrives.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-line bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-2xl transition-transform duration-300 group-hover:scale-110">
                  {item.icon}
                </div>

                <h3 className="mt-4 font-semibold">
                  {item.title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-muted">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured products */}
        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand">
                Shop smarter
              </p>

              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                Popular picks
              </h2>

              <p className="mt-1 text-sm text-muted">
                Some of the groceries shoppers love.
              </p>
            </div>

            <Link
              href="/products"
              className="shrink-0 text-sm font-semibold text-brand transition hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <div
                key={product.id}
                className="min-w-[76%] snap-start sm:min-w-0"
              >
                <ProductCard
                  product={product}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Offers & Promotions */}
        <section className="mx-auto max-w-7xl px-4 pb-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand">
                🎁 SundayShop offers
              </p>

              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                Save on your grocery order
              </h2>

              <p className="mt-1 text-sm text-muted">
                Sign in and use these coupon codes at checkout.
              </p>
            </div>
          </div>

          {loadingCoupons ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-2xl bg-surface-2"
                />
              ))}
            </div>
          ) : coupons.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="rounded-2xl border border-line bg-surface p-5"
                >
                  <Badge tone="brand">
                    {coupon.code}
                  </Badge>

                  <h3 className="mt-3 text-2xl font-bold text-brand">
                    {formatCouponDiscount(coupon)}
                  </h3>

                  <p className="mt-2 text-sm text-muted">
                    {coupon.minimum_order_value
                      ? `On orders above ₹${coupon.minimum_order_value}`
                      : "No minimum order"}
                  </p>

                  {coupon.maximum_discount ? (
                    <p className="mt-1 text-xs text-muted">
                      Maximum discount ₹
                      {coupon.maximum_discount}
                    </p>
                  ) : null}

                  <Link
                    href="/login"
                    className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                  >
                    Sign in to use
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-line bg-surface p-8 text-center">
              <p className="font-semibold">
                New offers coming soon
              </p>

              <p className="mt-1 text-sm text-muted">
                Check back soon for SundayShop promotions.
              </p>
            </div>
          )}
        </section>

        {/* Seasonal offer */}
        <section className="mx-auto max-w-7xl px-4 pb-14">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:p-10">
            <div className="relative z-10 max-w-2xl">
              <Badge tone="ai">
                🛒 Fresh savings
              </Badge>

              <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                Stock up on everyday essentials
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted sm:text-base">
                Discover fresh produce and grocery essentials
                at prices made for everyday shopping.
              </p>

              <Link
                href="/deals"
                className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
              >
                Explore today's deals →
              </Link>
            </div>

            <div className="pointer-events-none absolute -right-10 -top-10 text-[9rem] opacity-10 sm:text-[12rem]">
              🥬
            </div>

            <div className="pointer-events-none absolute -bottom-12 right-24 text-[6rem] opacity-10">
              🍎
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="rounded-3xl border border-line bg-surface px-6 py-10 text-center sm:px-10 sm:py-14">
            <p className="text-sm font-semibold text-brand">
              SundayShop
            </p>

            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Ready to shop smarter?
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
              Create your account and start shopping fresh
              groceries at great prices.
            </p>

            <div className="mt-6">
              <Link href="/login">
                <Button size="lg">
                  Create your account
                </Button>
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
  return (
    <main className="pb-12">
      {/* Welcome hero */}
      <section className="mx-auto max-w-7xl px-4 pt-5 sm:pt-7">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand px-6 py-8 text-white sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />

          <div className="relative max-w-3xl">
            <p className="text-sm text-white/70">
              Welcome back
              {user.name ? `, ${user.name}` : ""}
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              What are you shopping for today?
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
              Fresh groceries, low prices and convenient delivery.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand transition hover:bg-white/90 active:scale-[0.98]"
            >
              Shop groceries →
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">
              Browse
            </p>

            <h2 className="text-2xl font-bold sm:text-3xl">
              Shop by category
            </h2>
          </div>

          <Link
            href="/products"
            className="shrink-0 text-sm font-semibold text-brand hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group min-w-[118px] snap-start rounded-2xl border border-line bg-surface p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[var(--shadow)] active:scale-[0.97]"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                {category.emoji}
              </div>

              <p className="mt-3 whitespace-nowrap text-sm font-semibold">
                {category.name}
              </p>

              <p className="mt-1 text-xs text-muted">
                Explore →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Deals */}
      <section className="mx-auto max-w-7xl px-4 pt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cta">
              💰 Save more
            </p>

            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              Today's low prices
            </h2>

            <p className="mt-1 text-sm text-muted">
              Great deals on everyday essentials.
            </p>
          </div>

          <Link
            href="/deals"
            className="shrink-0 text-sm font-semibold text-brand hover:underline"
          >
            See all →
          </Link>
        </div>

        {deals.length > 0 ? (
          <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {deals.map((product) => (
              <div
                key={product.id}
                className="min-w-[76%] snap-start sm:min-w-0"
              >
                <ProductCard
                  product={product}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
            New deals are coming soon.
          </div>
        )}
      </section>

      {/* Offers & Promotions */}
      <section className="mx-auto max-w-7xl px-4 pt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand">
              🎁 Save more
            </p>

            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              Offers & promotions
            </h2>

            <p className="mt-1 text-sm text-muted">
              Use these coupon codes at checkout.
            </p>
          </div>
        </div>

        {loadingCoupons ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-2xl bg-surface-2"
              />
            ))}
          </div>
        ) : coupons.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow)]"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/10" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Special offer
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-brand">
                        {formatCouponDiscount(coupon)}
                      </h3>
                    </div>

                    <Badge tone="success">
                      Active
                    </Badge>
                  </div>

                  <div className="mt-4 rounded-xl border border-dashed border-brand/30 bg-brand/5 p-3">
                    <p className="text-xs text-muted">
                      Coupon code
                    </p>

                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-bold tracking-wider">
                        {coupon.code}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          copyCoupon(coupon.code)
                        }
                        className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:scale-[0.97]"
                      >
                        {copiedCoupon === coupon.code
                          ? "Copied!"
                          : "Copy code"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-xs text-muted">
                    {coupon.minimum_order_value ? (
                      <p>
                        Minimum order ₹
                        {coupon.minimum_order_value}
                      </p>
                    ) : (
                      <p>No minimum order</p>
                    )}

                    {coupon.maximum_discount ? (
                      <p>
                        Maximum discount ₹
                        {coupon.maximum_discount}
                      </p>
                    ) : null}

                    <p>
                      {coupon.expires_at
                        ? `Valid until ${formatCouponExpiry(
                            coupon.expires_at,
                          )}`
                        : "No expiry"}
                    </p>

                    {coupon.first_order_only ? (
                      <p className="font-medium text-brand">
                        First order only
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-line bg-surface p-8 text-center">
            <p className="text-lg font-semibold">
              No active offers right now
            </p>

            <p className="mt-1 text-sm text-muted">
              Check back soon for new SundayShop promotions.
            </p>
          </div>
        )}
      </section>

      {/* Seasonal offer */}
      <section className="mx-auto max-w-7xl px-4 pt-12">
        <div className="relative overflow-hidden rounded-3xl bg-surface-2 p-6 sm:p-8 lg:p-10">
          <div className="relative z-10 max-w-2xl">
            <Badge tone="ai">
              ✨ Fresh picks
            </Badge>

            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
              Fresh groceries for your everyday needs
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
              From fruits and vegetables to everyday essentials,
              discover everything you need in one place.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
            >
              Explore groceries →
            </Link>
          </div>

          <div className="pointer-events-none absolute -right-8 -top-10 text-[8rem] opacity-10 sm:text-[11rem]">
            🍎
          </div>

          <div className="pointer-events-none absolute bottom-0 right-28 text-[5rem] opacity-10">
            🥕
          </div>
        </div>
      </section>

      {/* Personalized recommendations */}
      <section className="mx-auto max-w-7xl px-4 pt-12">
        <RecommendedProducts />
      </section>

      {/* Personalized Family Grocery Package */}
<section className="mx-auto max-w-7xl px-4 pt-12">
  <FamilyGroceryPackage
    products={activeProducts}
  />
</section>

      {/* Popular groceries */}
      <section className="mx-auto max-w-7xl px-4 pt-12">
        <div>
          <p className="text-sm font-semibold text-brand">
            🥬 Fresh today
          </p>

          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
            Popular groceries
          </h2>

          <p className="mt-1 text-sm text-muted">
            Popular choices from SundayShop.
          </p>
        </div>

        <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {best.map((product) => (
            <div
              key={product.id}
              className="min-w-[76%] snap-start sm:min-w-0"
            >
              <ProductCard
                product={product}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Delivery promise */}
      <section className="mx-auto max-w-7xl px-4 pt-12">
        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: "🚚",
                title: "Fast delivery",
                text: "Get your everyday groceries without the long wait.",
              },
              {
                icon: "💵",
                title: "Cash on delivery",
                text: "Pay when your order reaches your doorstep.",
              },
              {
                icon: "📍",
                title: "Track your order",
                text: "Follow your delivery status from order to doorstep.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-2xl transition-transform duration-300 group-hover:scale-110">
                  {item.icon}
                </div>

                <h3 className="mt-3 font-semibold">
                  {item.title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-muted">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}