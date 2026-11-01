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
      image:"/images/home/fruits-banner.jpg"
        ,
    },
    {
      slug: "vegetables",
      name: "Vegetables",
      image:
        "/images/home/vegetables-banner.jpg",
    },
    {
      slug: "dairy",
      name: "Dairy & Eggs",
      image:
        "/images/home/dairy.jpg",
    },
    {
      slug: "staples",
      name: "Rice, Atta & Grains",
      image:
        "/images/home/staples.jpg",
    },
    {
      slug: "pulses",
      name: "Pulses",
      image:
        "/images/home/pulses.jpg",
    },
    {
      slug: "spices",
      name: "Masala & Spices",
      image:
        "/images/home/spices.jpg",
    },
    {
      slug: "snacks",
      name: "Snacks",
      image:
        "/images/home/snacks.jpg",
    },
    {
      slug: "beverages",
      name: "Beverages",
      image:
        "/images/home/beverages.jpg",
    },
    {
      slug: "household",
      name: "Household",
      image:
        "/images/home/household.jpg",
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
            {/* Right Side Oval + Grocery Cart Image Composition */}
<div className="relative flex items-center justify-center lg:col-span-5 pt-3 pb-1 sm:py-6 lg:py-0 w-full">
  <div className="relative w-full max-w-[420px] sm:max-w-[520px] lg:max-w-[600px] h-[300px] sm:h-[380px] lg:h-[440px] flex items-center justify-center mx-auto">

    {/* Large pale-green oval behind the image */}
    <div
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[190px] sm:h-[250px] lg:h-[300px] w-full rounded-[50%] bg-[#E4F2E9]"
      aria-hidden="true"
    />

    {/* Delivery cart image — no frame or inner oval */}
    <img
      src="/images/home/delivery-cart.png"
      alt="SundayShop grocery delivery cart filled with fresh produce"
      className="relative z-10 w-full h-full object-contain"
      loading="eager"
    />

    {/* Fast delivery badge */}
    <div className="absolute top-2 right-0 sm:top-3 sm:right-1 z-20 flex items-center gap-1.5 sm:gap-2.5 rounded-xl sm:rounded-2xl bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-md border border-[#E9E6DC]">
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

    {/* Freshness badge */}
    <div className="absolute bottom-2 left-0 sm:bottom-3 sm:left-1 z-20 flex items-center gap-1.5 sm:gap-2.5 rounded-xl sm:rounded-2xl bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-md border border-[#E9E6DC]">
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

    {/* Promotional Banners */}
<section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

    {/* Fruits & Vegetables */}
    <Link
      href="/products?category=fruits"
      className="group relative flex min-h-[190px] items-end overflow-hidden rounded-2xl bg-green-900 p-5"
    >
      <img
        src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=700&q=85"
        alt="Fresh fruits"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative z-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-green-200">
          Fresh every day
        </p>
        <h3 className="text-xl font-extrabold text-white">
          Fresh Fruits & Veggies
        </h3>
        <span className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-green-800">
          Explore Now →
        </span>
      </div>
    </Link>

    {/* Daily Essentials */}
    <Link
      href="/products?category=staples"
      className="group relative flex min-h-[190px] items-end overflow-hidden rounded-2xl bg-amber-900 p-5"
    >
      <img
        src="https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=85"
        alt="Grocery essentials"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative z-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-200">
          Stock up today
        </p>
        <h3 className="text-xl font-extrabold text-white">
          Daily Grocery Essentials
        </h3>
        <span className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-amber-800">
          Shop Now →
        </span>
      </div>
    </Link>

    {/* Snacks */}
    <Link
      href="/products?category=snacks"
      className="group relative flex min-h-[190px] items-end overflow-hidden rounded-2xl bg-orange-900 p-5"
    >
      <img
        src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=700&q=85"
        alt="Snacks"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative z-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-orange-200">
          Something tasty
        </p>
        <h3 className="text-xl font-extrabold text-white">
          Snacks for Every Craving
        </h3>
        <span className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-orange-800">
          Discover More →
        </span>
      </div>
    </Link>

  </div>
</section>
  
        {/* 8. Promotional banner */}
      
<section className="mx-auto max-w-7xl px-3 pt-4 sm:px-4 sm:pt-6">
  <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#F04F24] via-[#F76B2E] to-[#FF9B42] p-5 text-white shadow-xl sm:rounded-[32px] sm:p-8 lg:p-10">

    {/* Decorative circles */}
    <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-300/20 blur-2xl" />
    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/15 blur-2xl" />

    <div className="relative z-10 grid items-center gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">

      {/* Left content */}
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] backdrop-blur-sm sm:text-xs">
          <span>✨</span>
          Today's Special Offers
        </span>

        <h2 className="mt-4 max-w-xl text-[38px] font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-[62px]">
          FRESH
          <br />
          FINDS.
          <br />
          <span className="text-[#FFF1A8]">BETTER</span> PRICES.
        </h2>

        <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-white/90 sm:text-base">
          Your everyday groceries, fruits and essentials — fresh picks and
          exciting savings, all in one place.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-[#E94F24] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#FFF4E9] active:translate-y-0"
        >
          SHOP NOW
          <span className="text-lg">→</span>
        </Link>
      </div>

      {/* Right coupon card */}
      {coupons.length > 0 && (
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -right-2 -top-3 z-10 rotate-6 rounded-full bg-[#FFE66D] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#713A16] shadow-md sm:-right-3">
            Limited Offer!
          </div>

          <div className="overflow-hidden rounded-[24px] bg-white text-[#252525] shadow-2xl sm:rounded-[28px]">
            <div className="bg-[#FFF5E9] px-5 py-4 text-center sm:px-7">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E95A2A] sm:text-xs">
                A LITTLE SOMETHING FOR YOU
              </p>

              <h3 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                SAVE MORE!
              </h3>
            </div>

            <div className="px-5 py-5 text-center sm:px-7 sm:py-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                USE THIS COUPON
              </p>

              <button
                type="button"
                onClick={() => copyCoupon(coupons[0].code)}
                className="mt-3 w-full rounded-xl border-2 border-dashed border-[#F16A37] bg-[#FFF9F4] px-3 py-4 font-mono text-2xl font-black tracking-[0.12em] text-[#E94F24] transition hover:bg-[#FFF0E5] sm:text-3xl"
              >
                {copiedCoupon === coupons[0].code
                  ? "COPIED! ✓"
                  : coupons[0].code}
              </button>

              <p className="mt-3 text-sm font-bold text-gray-700">
                {formatCouponDiscount(coupons[0])}
              </p>

              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Tap the code to copy it
              </p>
            </div>

            <div className="border-t border-dashed border-gray-200 bg-[#FFFDFB] px-5 py-3 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#E95A2A]">
                FRESHNESS • VALUE • HAPPINESS
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
</section>
      
      {/* 3. Shop by Category */}
<section className="mx-auto max-w-7xl px-3 sm:px-4 pt-3 sm:pt-8">
  <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E9E6DC] p-3.5 sm:p-6 shadow-xs">

    <div className="flex items-center justify-between gap-4 mb-4 sm:mb-5">
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

    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-x-2 gap-y-5 sm:gap-x-4 sm:gap-y-6">
      {homeCategories.map((category, index) => {
        const tileColors = [
          "bg-[#EAF5DF]",
          "bg-[#FFF2D2]",
          "bg-[#FCE8E5]",
          "bg-[#E5F2FA]",
          "bg-[#F2EAF8]",
          "bg-[#FCEEDC]",
          "bg-[#E4F3EF]",
          "bg-[#F9E8F0]",
          "bg-[#EEF0DF]",
        ];

        return (
          <Link
            key={category.slug}
            href={`/products?category=${category.slug}`}
            className="group flex min-w-0 flex-col items-center text-center focus:outline-none"
          >
            <div
              className={`w-full aspect-square max-w-[110px] overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md ${tileColors[index % tileColors.length]}`}
            >
              <img
                src={category.image}
                alt={category.name}
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>

            <span className="mt-2 text-[10px] sm:text-xs font-semibold leading-tight text-ink group-hover:text-brand line-clamp-2">
              {category.name}
            </span>
          </Link>
        );
      })}
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
<section className="mx-auto max-w-7xl px-3 pt-8 sm:px-4 sm:pt-12">
  <div className="relative overflow-hidden rounded-[28px] bg-[#FFF0C2] px-4 py-6 sm:rounded-[32px] sm:px-8 sm:py-9">

    {/* Decorative shapes */}
    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-[#FFB4A2]/50" />
    <div className="pointer-events-none absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-[#B9DDA8]/60" />

    <div className="relative z-10">

      {/* Editorial heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#D94F38]">
            SUNDAYSHOP PRESENTS
          </span>

          <h2 className="mt-2 font-black text-[40px] leading-[0.9] tracking-[-0.06em] text-[#34254C] sm:text-6xl lg:text-7xl">
            FAMILY
            <br />
            <span className="font-serif font-normal italic text-[#E65B43]">
              BUNDLE.
            </span>
          </h2>

          <p className="mt-4 max-w-md text-sm font-semibold leading-relaxed text-[#66536C] sm:text-base">
            Big family? Big grocery list? We've got your everyday essentials
            covered in one convenient package.
          </p>
        </div>

        {/* Decorative sticker */}
        <div className="flex h-24 w-24 rotate-12 flex-col items-center justify-center rounded-full bg-[#E85B43] text-center text-white shadow-lg sm:h-32 sm:w-32">
          <span className="text-3xl sm:text-4xl">🧺</span>
          <span className="mt-1 text-[9px] font-black uppercase tracking-wider sm:text-[10px]">
            SHOP TOGETHER
          </span>
        </div>
      </div>

      {/* Package component */}
      <div className="relative mt-7">
        <FamilyGroceryPackage products={activeProducts} />
      </div>

      {/* Bottom strip */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-[#D9C58D] pt-4">
        <p className="text-xs font-black uppercase tracking-wider text-[#34254C] sm:text-sm">
          GOOD FOOD. GREAT FAMILY MOMENTS.
        </p>
        <span className="rounded-full bg-[#34254C] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white sm:text-xs">
          MADE FOR EVERY HOME ♥
        </span>
      </div>

    </div>
  </div>
</section>

      {/* 7. Recommended for You */}
      <section className="mx-auto max-w-7xl px-4">
        <RecommendedProducts />
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