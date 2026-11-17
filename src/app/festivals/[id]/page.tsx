"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui";
import {
  buildFestiveCollections,
  mapCampaignProducts,
  maxCampaignDiscount,
  type FestivalCampaign,
  type FestiveProduct,
} from "@/components/festive/campaign-utils";
import { FestiveCarousel } from "@/components/festive/festive-carousel";
import { FestiveCategoryTiles } from "@/components/festive/festive-category-tiles";
import { FestivalHero } from "@/components/festive/festival-hero";
import { FestiveProductCard } from "@/components/festive/festive-product-card";
import { FestiveSection } from "@/components/festive/festive-section";
import { FESTIVE_PRICE_NOTE } from "@/components/festive/festive-showcase";
import { resolveFestivalTheme } from "@/components/festive/festival-themes";

type SortKey = "featured" | "festive" | "price-asc" | "price-desc" | "rating";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "festive", label: "Biggest festive offer" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Customer rating" },
];

function sortProducts(products: FestiveProduct[], sort: SortKey) {
  const sorted = [...products];
  switch (sort) {
    case "festive":
      return sorted.sort((a, b) => b.festiveDiscount - a.festiveDiscount);
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    default:
      return sorted.sort((a, b) => a.displayOrder - b.displayOrder);
  }
}

function LoadingState() {
  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10" aria-busy="true">
      <div className="h-[420px] animate-pulse rounded-3xl bg-surface-2 sm:h-[360px]" />
      <div className="mt-8 h-6 w-56 animate-pulse rounded bg-surface-2" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="aspect-[3/5] animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
      <span className="sr-only">Loading festival offers...</span>
    </main>
  );
}

export default function FestivalOffersPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;

  const [campaign, setCampaign] = useState<FestivalCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("featured");

  useEffect(() => {
    async function loadCampaign() {
      try {
        const response = await fetch(
          `/api/festival-campaigns/${campaignId}`,
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load festival offers.",
          );
        }

        setCampaign(result.campaign);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load festival offers.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (campaignId) loadCampaign();
  }, [campaignId]);

  const theme = resolveFestivalTheme(campaign ?? {});
  const products = useMemo(() => mapCampaignProducts(campaign), [campaign]);

  const collections = useMemo(
    () =>
      buildFestiveCollections(products, campaign?.festival_name ?? "festive", {
        includeCategories: true,
      }),
    [products, campaign?.festival_name],
  );

  const categoryFilters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      if (product.category) {
        counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [products]);

  const visibleProducts = useMemo(
    () =>
      sortProducts(
        activeCategory === "all"
          ? products
          : products.filter((product) => product.category === activeCategory),
        sort,
      ),
    [products, activeCategory, sort],
  );

  if (loading) return <LoadingState />;

  if (error || !campaign) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">
          Festival offers unavailable
        </h1>
        <p className="mt-2 text-muted">
          {error || "This campaign is no longer available."}
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button>Back to Home</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-8">
      <nav className="mb-3 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="font-semibold text-ink">{campaign.festival_name}</span>
      </nav>

      <FestivalHero
        campaign={campaign}
        products={products}
        theme={theme}
        maxDiscount={maxCampaignDiscount(products)}
        ctaHref="#all-offers"
        headingLevel="h1"
      />

      {products.length > 0 ? (
        <>
          <div
            className="mt-4 rounded-3xl border px-3 pb-5 sm:px-6 sm:pb-7"
            style={{ background: theme.soft, borderColor: theme.softBorder }}
          >
            <FestiveCategoryTiles
              theme={theme}
              products={products}
              festivalName={campaign.festival_name}
            />

            {collections.map((collection) => (
              <FestiveSection
                key={collection.key}
                theme={theme}
                eyebrow={collection.eyebrow}
                title={collection.title}
                subtitle={collection.subtitle}
              >
                <FestiveCarousel ariaLabel={collection.title}>
                  {collection.products.map((product) => (
                    <FestiveProductCard key={product.id} product={product} theme={theme} />
                  ))}
                </FestiveCarousel>
              </FestiveSection>
            ))}
          </div>

          <FestiveSection
            id="all-offers"
            theme={theme}
            eyebrow="More to explore"
            title={`All ${campaign.festival_name} Offers`}
            subtitle={`${products.length} ${products.length === 1 ? "product" : "products"} selected for this festival`}
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
                {[["all", products.length] as [string, number], ...categoryFilters].map(
                  ([category, count]) => {
                    const active = activeCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        aria-pressed={active}
                        className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition sm:text-sm"
                        style={
                          active
                            ? { background: theme.pageAccent, borderColor: theme.pageAccent, color: "#ffffff" }
                            : undefined
                        }
                      >
                        {category === "all" ? "All" : category}
                        <span className="ml-1 opacity-70">({count})</span>
                      </button>
                    );
                  },
                )}
              </div>

              <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-muted sm:text-sm">
                Sort by
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-brand sm:text-sm"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {visibleProducts.map((product) => (
                <FestiveProductCard key={product.id} product={product} theme={theme} />
              ))}
            </div>
          </FestiveSection>

          <p className="mt-4 text-[11px] text-muted">{FESTIVE_PRICE_NOTE}</p>
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-10 text-center text-muted">
          No products are currently available in this campaign.
        </div>
      )}

      <div className="mt-10 text-center">
        <Link href="/" className="text-sm font-semibold text-brand hover:underline">
          ← Continue Shopping
        </Link>
      </div>
    </main>
  );
}
