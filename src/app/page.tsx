"use client";

import Link from "next/link";
import { categories, products as defaultProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import RecommendedProducts from "@/components/recommended-products";
import FamilyGroceryPackage from "@/components/family-grocery-package";
import { Badge, Button } from "@/components/ui";
import { useStore } from "@/components/providers";
import { useEffect, useState } from "react";
import { Check, Clock, Leaf, Truck } from "lucide-react";

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

  const activeProducts = (
    catalogProducts.length > 0 ? catalogProducts : defaultProducts
  ).filter((product) => product.active !== false);

  const homeCategories = [
    {
      slug: "fruits",
      name: "Fruits",
      image:
        "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=300&q=80",
    },
    {
      slug: "vegetables",
      name: "Vegetables",
      image:
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80",
    },
    {
      slug: "dairy",
      name: "Dairy & Eggs",
      image:
        "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=300&q=80",
    },
    {
      slug: "staples",
      name: "Rice, Atta & Grains",
      image:
        "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80",
    },
    {
      slug: "pulses",
      name: "Pulses",
      image:
        "https://images.unsplash.com/photo-1585996838653-5d7a1f1c9f89?auto=format&fit=crop&w=300&q=80",
    },
    {
      slug: "spices",
      name: "Masala & Spices",
      image:
        "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&q=80",
    },
    {
      slug: "snacks",
      name: "Snacks",
      image:
        "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=300&q=80",
    },
    {
      slug: "beverages",
      name: "Beverages",
      image:
        "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=300&q=80",
    },
    {
      slug: "household",
      name: "Household",
      image:
        "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=300&q=80",
    },
  ];

  // 4. Today's Low Prices
  const todaysLowPrices = activeProducts
    .filter((p) => p.mrp > p.price)
    .sort(
      (a, b) =>
        (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp,
    )
    .slice(0, 10);

  const displayLowPrices =
    todaysLowPrices.length >= 4
      ? todaysLowPrices
      : activeProducts.slice(0, 10);

  // 5. Fresh Fruits & Vegetables
  const fruitsAndVeg = activeProducts
    .filter((p) => {
      const c = (p.category || "").toLowerCase();
      const s = (p.subcategory || "").toLowerCase();
      return (
        c === "fruits" ||
        c === "vegetables" ||
        s.includes("fruit") ||
        s.includes("veg")
      );
    })
    .slice(0, 10);

  const displayProduce =
    fruitsAndVeg.length >= 3
      ? fruitsAndVeg
      : defaultProducts
          .filter(
            (p) =>
              p.category === "fruits" ||
              p.category === "vegetables",
          )
          .slice(0, 10);

  // 9. Daily Essentials
  const dailyEssentials = activeProducts
    .filter((p) => {
      const c = (p.category || "").toLowerCase();
      return (
        c === "staples" ||
        c === "dairy" ||
        c === "pulses" ||
        c === "spices" ||
        p.tags?.includes("Daily essential")
      );
    })
    .slice(0, 10);

  const displayEssentials =
    dailyEssentials.length >= 3
      ? dailyEssentials
      : defaultProducts
          .filter(
            (p) =>
              p.category === "staples" ||
              p.category === "dairy" ||
              p.category === "pulses",
          )
          .slice(0, 10);

  // 10. Best Deals
  const bestDeals = [...activeProducts]
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-bg pb-16">
      {/* 2. Hero */}
      <section className="mx-auto max-w-7xl px-0 md:px-4 pt-0 md:pt-6">
        <div className="relative overflow-hidden rounded-none md:rounded-[2.5rem] bg-[#F8F7F1] border-b md:border border-[#E9E6DC] px-4 py-3 sm:py-8 lg:p-12 shadow-none md:shadow-xs">
          {/* Subtle ambient warm blur in corners */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-amber-100/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-100/30 blur-3xl" />

          <div className="flex flex-col gap-2 sm:gap-6 lg:grid lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <div className="z-10 lg:col-span-7">
              {/* Eyebrow with golden accent line */}
              <div className="flex items-center gap-1.5 mb-1 sm:mb-3">
                <span className="h-[2px] w-4 sm:w-6 bg-amber-400 rounded-full" />
                <span className="text-[10px] sm:text-[13px] font-bold uppercase tracking-wider text-[#5c6b75]">
                  FARM-FRESH PICKS, EVERY DAY
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-[28px] sm:text-[34px] md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.08] sm:leading-[1.12] text-[#132029]">
                Fresh groceries.
                <br />
                Better prices.
                <br />
                <span className="text-brand">Delivered to you.</span>
              </h1>

              {/* Description */}
              <p className="mt-1.5 sm:mt-4 max-w-sm sm:max-w-lg text-xs sm:text-base leading-relaxed text-[#5c6b75]">
                From crisp produce to everyday essentials, fill your basket with quality you can trust—without stretching your budget.
              </p>

              {/* Shop Now CTA */}
              <div className="mt-3 sm:mt-6">
                <Link
                  href="/products"
                  className="inline-flex h-[44px] sm:h-[46px] w-[130px] items-center justify-center gap-1.5 rounded-xl bg-[#f05a28] hover:bg-[#d84e1d] text-sm font-bold text-white shadow-sm transition active:scale-98"
                >
                  Shop Now →
                </Link>
              </div>

              {/* Delivery Row (directly underneath Shop Now) */}
              <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#132029]">
                <span className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-brand-soft text-brand">
                  <Clock size={13} className="sm:hidden" />
                  <Clock size={15} className="hidden sm:block" />
                </span>
                <span>Delivery by tomorrow</span>
              </div>

              {/* Trust Points (immediately below delivery info) */}
              <div className="mt-2 sm:mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-1 sm:gap-x-6 sm:gap-y-2 text-[11px] sm:text-sm font-medium text-[#132029]">
                <span className="inline-flex items-center gap-1">
                  <Check size={13} className="text-emerald-600 stroke-[3]" />
                  Fresh products
                </span>
                <span className="inline-flex items-center gap-1">
                  <Check size={13} className="text-emerald-600 stroke-[3]" />
                  Low prices
                </span>
                <span className="inline-flex items-center gap-1">
                  <Check size={13} className="text-emerald-600 stroke-[3]" />
                  Reliable delivery
                </span>
              </div>
            </div>

            {/* Right Side Oval + Grocery Image Composition */}
            <div className="relative flex items-center justify-center lg:col-span-5 pt-3 pb-1 sm:py-6 lg:py-0 w-full">
              <div className="relative w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px] h-[175px] sm:h-[220px] lg:h-[260px] flex items-center justify-center mx-auto">
                {/* Large soft/pale green oval sitting behind the grocery image */}
                <div
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[120px] sm:h-[160px] lg:h-[190px] w-full rounded-[50%] bg-[#E4F2E9] border border-[#CFE7D8]/80 shadow-[0_4px_24px_rgba(14,92,99,0.06)]"
                  aria-hidden="true"
                />

                {/* Grocery image centered horizontally and overlapping the oval */}
                <div className="relative z-10 w-[200px] sm:w-[260px] lg:w-[310px] h-[135px] sm:h-[175px] lg:h-[205px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border-2 border-white bg-white">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80"
                    alt="Fresh grocery basket and farm produce"
                    className="w-full h-full object-cover object-center scale-105"
                    loading="eager"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
                </div>

                {/* Floating Badge: Top-Right (Fast delivery) */}
                <div className="absolute top-0 right-1 sm:-top-2 sm:right-0 z-20 flex items-center gap-1.5 sm:gap-2.5 rounded-xl sm:rounded-2xl bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-md border border-[#E9E6DC]">
                  <span className="grid h-6 w-6 sm:h-8 sm:w-8 place-items-center rounded-lg sm:rounded-xl bg-brand-soft text-brand">
                    <Truck size={13} className="sm:hidden" />
                    <Truck size={16} className="hidden sm:block" />
                  </span>
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-[#132029] leading-tight">
                      Fast delivery
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-medium text-muted leading-tight">
                      Right to your doorstep
                    </p>
                  </div>
                </div>

                {/* Floating Badge: Bottom-Left (100% Fresh) */}
                <div className="absolute bottom-0 left-1 sm:-bottom-2 sm:left-0 z-20 flex items-center gap-1.5 sm:gap-2.5 rounded-xl sm:rounded-2xl bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-md border border-[#E9E6DC]">
                  <span className="grid h-6 w-6 sm:h-8 sm:w-8 place-items-center rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600">
                    <Leaf size={13} className="fill-emerald-600/20 sm:hidden" />
                    <Leaf size={16} className="fill-emerald-600/20 hidden sm:block" />
                  </span>
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-[#132029] leading-tight">
                      100% fresh
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-medium text-muted leading-tight">
                      Quality checked
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Shop by Category */}
      <section className="mx-auto max-w-7xl px-3 sm:px-4 pt-3 sm:pt-8">
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E9E6DC] p-3.5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#f05a28]">
                EVERYDAY FRESH
              </span>
              <h2 className="text-base sm:text-2xl font-bold text-ink">
                Shop by Category
              </h2>
            </div>

            <Link
              href="/products"
              className="shrink-0 text-xs sm:text-sm font-semibold text-brand hover:underline"
            >
              All categories →
            </Link>
          </div>

          <div className="flex gap-2.5 sm:gap-6 overflow-x-auto pb-1 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
            {homeCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="group flex flex-col items-center shrink-0 snap-start w-[72px] sm:w-24 text-center focus:outline-none"
              >
                <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-brand/5 border-2 border-line/70 p-1 transition-all duration-300 group-hover:scale-105 group-hover:border-brand group-hover:shadow-md">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover rounded-full"
                    loading="lazy"
                  />
                </div>

                <span className="mt-1.5 text-[11px] sm:text-xs font-semibold text-ink group-hover:text-brand line-clamp-2 leading-tight transition-colors">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Today's Low Prices */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:pt-12">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cta">
              ⚡ Limited Time Offers
            </span>
            <h2 className="mt-0.5 text-xl sm:text-2xl font-bold text-ink">
              Today&apos;s low prices
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-muted">
              Deep discounts on everyday household staples
            </p>
          </div>

          <Link
            href="/deals"
            className="shrink-0 text-xs sm:text-sm font-semibold text-brand hover:underline"
          >
            See all deals →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {displayLowPrices.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. Fresh Fruits & Vegetables */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:pt-12">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              🥬 Farm-Direct Harvest
            </span>
            <h2 className="mt-0.5 text-xl sm:text-2xl font-bold text-ink">
              Fresh Fruits & Vegetables
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-muted">
              Sorted every morning for supreme freshness and flavor
            </p>
          </div>

          <Link
            href="/products?category=fruits"
            className="shrink-0 text-xs sm:text-sm font-semibold text-brand hover:underline"
          >
            View all produce →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {displayProduce.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. Family Package */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:pt-12">
        <FamilyGroceryPackage products={activeProducts} />
      </section>

      {/* 7. Recommended for You */}
      <section className="mx-auto max-w-7xl px-4">
        <RecommendedProducts />
      </section>

      {/* 8. Promotional banner */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:pt-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c4e54] via-[#0e5c63] to-[#147780] p-6 text-white shadow-sm sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 right-1/3 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                ✨ Special Grocery Value
              </span>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                Fresh essentials, better prices.
              </h2>

              <p className="mt-2 text-sm text-white/85 sm:text-base leading-relaxed">
                Stock up on fresh farm produce, pure dairy, pantry staples and daily household favorites at genuine everyday savings.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href="/products"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand shadow-sm transition hover:bg-white/90 active:scale-98"
                >
                  Shop Essentials Now →
                </Link>

                {coupons.length > 0 && (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-medium backdrop-blur">
                    <span>Use coupon:</span>
                    <button
                      type="button"
                      onClick={() => copyCoupon(coupons[0].code)}
                      className="font-mono font-bold tracking-wider text-emerald-300 hover:underline"
                    >
                      {copiedCoupon === coupons[0].code
                        ? "COPIED! ✓"
                        : coupons[0].code}
                    </button>
                    <span>({formatCouponDiscount(coupons[0])})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden lg:block shrink-0">
              <div className="relative h-44 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-1.5 backdrop-blur shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80"
                  alt="Fresh groceries banner"
                  className="h-full w-full rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Daily Essentials */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:pt-14">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              🌾 Kitchen Staples
            </span>
            <h2 className="mt-0.5 text-xl sm:text-2xl font-bold text-ink">
              Daily Essentials
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-muted">
              Atta, rice, dal, milk and essentials your home needs every day
            </p>
          </div>

          <Link
            href="/products?category=staples"
            className="shrink-0 text-xs sm:text-sm font-semibold text-brand hover:underline"
          >
            Browse essentials →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {displayEssentials.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 10. Best Deals */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:pt-12">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              ⭐ Customer Favorites
            </span>
            <h2 className="mt-0.5 text-xl sm:text-2xl font-bold text-ink">
              Best Deals
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-muted">
              Top-selling groceries with outstanding shopper reviews
            </p>
          </div>

          <Link
            href="/deals"
            className="shrink-0 text-xs sm:text-sm font-semibold text-brand hover:underline"
          >
            View all deals →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {bestDeals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 11. Why SundayShop */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:pt-16">
        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:p-10 shadow-xs">
          <div className="mb-6 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-brand">
              The SundayShop Promise
            </p>
            <h2 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
              Why SundayShop?
            </h2>
            <p className="mt-1 text-sm text-muted">
              Smart grocery shopping made fresh, reliable, and convenient.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="flex flex-col items-start rounded-2xl border border-line/60 bg-surface-2/60 p-4 sm:p-5 transition hover:border-brand/30 hover:bg-surface">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-2xl">
                🥬
              </div>
              <h3 className="mt-3 text-sm sm:text-base font-bold text-ink">
                Fresh groceries
              </h3>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted">
                Farm-picked fruits & vegetables inspected for premium freshness.
              </p>
            </div>

            <div className="flex flex-col items-start rounded-2xl border border-line/60 bg-surface-2/60 p-4 sm:p-5 transition hover:border-brand/30 hover:bg-surface">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-2xl">
                💰
              </div>
              <h3 className="mt-3 text-sm sm:text-base font-bold text-ink">
                Low everyday prices
              </h3>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted">
                Direct-to-consumer pricing with unbeatable daily savings.
              </p>
            </div>

            <div className="flex flex-col items-start rounded-2xl border border-line/60 bg-surface-2/60 p-4 sm:p-5 transition hover:border-brand/30 hover:bg-surface">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-2xl">
                ⚡
              </div>
              <h3 className="mt-3 text-sm sm:text-base font-bold text-ink">
                Easy ordering
              </h3>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted">
                Smart search, quick cart additions and seamless checkout.
              </p>
            </div>

            <div className="flex flex-col items-start rounded-2xl border border-line/60 bg-surface-2/60 p-4 sm:p-5 transition hover:border-brand/30 hover:bg-surface">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-2xl">
                🚚
              </div>
              <h3 className="mt-3 text-sm sm:text-base font-bold text-ink">
                Reliable delivery
              </h3>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted">
                Prompt local delivery with live tracking & Cash on Delivery.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}