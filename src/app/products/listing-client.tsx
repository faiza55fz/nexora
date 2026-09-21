"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { products, categories } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { Select } from "@/components/ui";
import { cn } from "@/lib/format";

type Product = (typeof products)[number] & {
  active?: boolean;
};

export default function ListingClient() {
  const params = useSearchParams();

  const q0 = params.get("q") ?? "";
  const cat0 = params.get("category") ?? "all";

  const [q, setQ] = useState(q0);
  const [cat, setCat] = useState(cat0);
  const [sort, setSort] = useState("relevance");
  const [max, setMax] = useState(100000);
  const [mobileFilters, setMobileFilters] =
    useState(false);

  const [catalogProducts, setCatalogProducts] =
    useState<Product[]>([]);

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

        const mappedProducts: Product[] =
          result.products.map((product: any) => {
            const variant =
              product.product_variants?.find(
                (item: any) =>
                  item.active !== false,
              ) ||
              product.product_variants?.[0];

            const inventory =
              variant?.inventory;

            const primaryImage =
              product.product_images?.find(
                (image: any) =>
                  image.is_primary,
              )?.image_url ||
              product.product_images?.[0]
                ?.image_url ||
              "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80";

            return {
              ...products[0],

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
                Number(
                  product.review_count || 0,
                ),

              mrp:
                Number(
                  variant?.mrp || 0,
                ),

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
                  inventory?.stock_quantity ||
                    0,
                ),

              deliveryEta:
                "Tomorrow",

              specs: {
                Unit:
                  variant?.variant_name ||
                  "",
              },

              image:
                primaryImage,

              images:
                product.product_images?.map(
                  (image: any) =>
                    image.image_url,
                ) || [],

              sold: 0,
              sellerId: "nexora",
              location: "",
              tags: [],
              highlights: [],
              moq: 1,
              tiers: [],
            };
          });

        setCatalogProducts(
          mappedProducts,
        );
      } catch (error) {
        console.error(
          "Failed to load products:",
          error,
        );

        setCatalogProducts([]);
      }
    }

    loadCatalog();
  }, []);

  const list = useMemo(() => {
    let rows = catalogProducts.filter(
      (p) => {
        const hay =
          `${p.name} ${p.brand} ${p.category}`.toLowerCase();

        const okQ =
          !q ||
          hay.includes(
            q.toLowerCase(),
          );

        const okC =
          cat === "all" ||
          p.category === cat;

        const okActive =
          p.active !== false;

        const okP =
          p.price <= max;

        return (
          okActive &&
          okQ &&
          okC &&
          okP
        );
      },
    );

    if (sort === "price-asc") {
      rows = [...rows].sort(
        (a, b) =>
          a.price - b.price,
      );
    }

    if (sort === "price-desc") {
      rows = [...rows].sort(
        (a, b) =>
          b.price - a.price,
      );
    }

    if (sort === "rating") {
      rows = [...rows].sort(
        (a, b) =>
          b.rating - a.rating,
      );
    }

    return rows;
  }, [
    catalogProducts,
    q,
    cat,
    sort,
    max,
  ]);

  const categoryList = [
    {
      slug: "all",
      name: "All groceries",
      emoji: "🛒",
    },
    ...categories,
  ];

  const clearFilters = () => {
    setQ("");
    setCat("all");
    setMax(100000);
  };

  const hasFilters =
    q !== "" ||
    cat !== "all" ||
    max !== 100000;

  return (
    <main className="min-h-screen bg-bg">
      {/* Page header */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:py-9">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span>Home</span>
            <span>/</span>
            <span className="text-foreground">
              Groceries
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Fresh groceries
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Fruits, vegetables and everyday essentials at
                prices made for everyday shopping.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">
                {list.length}
              </span>

              <span className="text-muted">
                {list.length === 1
                  ? "product"
                  : "products"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Category chips */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categoryList.map(
              (category) => (
                <button
                  key={category.slug}
                  onClick={() =>
                    setCat(
                      category.slug,
                    )
                  }
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition",
                    cat ===
                      category.slug
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-bg hover:border-brand/30 hover:bg-brand-soft",
                  )}
                >
                  <span>
                    {category.emoji}
                  </span>

                  <span>
                    {category.name}
                  </span>
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop filters */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-28 rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal
                    size={17}
                  />

                  <h2 className="font-semibold">
                    Filters
                  </h2>
                </div>

                {hasFilters && (
                  <button
                    onClick={
                      clearFilters
                    }
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mt-5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Search
                </label>

                <div className="relative mt-2">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />

                  <input
                    value={q}
                    onChange={(e) =>
                      setQ(
                        e.target.value,
                      )
                    }
                    placeholder="Search groceries"
                    className="h-10 w-full rounded-xl border border-line bg-bg pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Category
                </p>

                <div className="mt-2 space-y-1">
                  {categoryList.map(
                    (category) => (
                      <button
                        key={
                          category.slug
                        }
                        onClick={() =>
                          setCat(
                            category.slug,
                          )
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition",
                          cat ===
                            category.slug
                            ? "bg-brand-soft font-semibold text-brand"
                            : "hover:bg-surface-2",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span>
                            {
                              category.emoji
                            }
                          </span>

                          {
                            category.name
                          }
                        </span>

                        {cat ===
                          category.slug && (
                          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                        )}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mt-6 border-t border-line pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Price
                  </p>

                  <span className="text-sm font-semibold">
                    ₹
                    {max.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>

                <input
                  type="range"
                  min={200}
                  max={100000}
                  value={max}
                  onChange={(e) =>
                    setMax(
                      Number(
                        e.target.value,
                      ),
                    )
                  }
                  className="mt-4 w-full accent-[var(--brand)]"
                />

                <div className="mt-1 flex justify-between text-[11px] text-muted">
                  <span>
                    ₹200
                  </span>

                  <span>
                    ₹1,00,000
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Products */}
          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                {q ? (
                  <p className="text-sm text-muted">
                    Showing results for{" "}
                    <span className="font-semibold text-foreground">
                      “{q}”
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted">
                    Fresh picks for your everyday needs
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setMobileFilters(
                      true,
                    )
                  }
                  className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold lg:hidden"
                >
                  <Filter
                    size={16}
                  />
                  Filters
                </button>

                <Select
                  value={sort}
                  onChange={(e) =>
                    setSort(
                      e.target.value,
                    )
                  }
                  className="h-10 w-44 bg-surface"
                  aria-label="Sort products"
                >
                  <option value="relevance">
                    Recommended
                  </option>

                  <option value="price-asc">
                    Price: low to high
                  </option>

                  <option value="price-desc">
                    Price: high to low
                  </option>

                  <option value="rating">
                    Top rated
                  </option>
                </Select>
              </div>
            </div>

            {/* Active filter */}
            {hasFilters && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">
                  Active filters:
                </span>

                {q && (
                  <button
                    onClick={() =>
                      setQ("")
                    }
                    className="flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand"
                  >
                    Search: {q}
                    <X size={12} />
                  </button>
                )}

                {cat !== "all" && (
                  <button
                    onClick={() =>
                      setCat(
                        "all",
                      )
                    }
                    className="flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand"
                  >
                    {
                      categoryList.find(
                        (c) =>
                          c.slug ===
                          cat,
                      )?.name ??
                        cat
                    }

                    <X size={12} />
                  </button>
                )}

                {max !== 100000 && (
                  <button
                    onClick={() =>
                      setMax(
                        100000,
                      )
                    }
                    className="flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand"
                  >
                    Up to ₹
                    {max.toLocaleString(
                      "en-IN",
                    )}

                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Empty state */}
            {list.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center">
                <div className="text-4xl">
                  🛒
                </div>

                <h2 className="mt-4 text-xl font-bold">
                  No groceries found
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                  Try a different search or remove some
                  filters to see more products.
                </p>

                <button
                  onClick={
                    clearFilters
                  }
                  className="mt-5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map(
                  (product) => (
                    <ProductCard
                      key={
                        product.id
                      }
                      product={
                        product
                      }
                    />
                  ),
                )}
              </div>
            )}

            {/* Bottom reassurance */}
            {list.length > 0 && (
              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-lg">
                    🥬
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    Fresh products
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    Fresh fruits, vegetables and daily
                    essentials.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-lg">
                    💰
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    Everyday prices
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    Shop essentials at competitive prices.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-lg">
                    🚚
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    1-day delivery
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    Convenient delivery to your doorstep.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile filter drawer */}
      {mobileFilters && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() =>
            setMobileFilters(false)
          }
        >
          <aside
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={18} />

                <h2 className="text-lg font-bold">
                  Filters
                </h2>
              </div>

              <button
                onClick={() =>
                  setMobileFilters(
                    false,
                  )
                }
                className="grid h-9 w-9 place-items-center rounded-xl hover:bg-surface-2"
                aria-label="Close filters"
              >
                <X size={19} />
              </button>
            </div>

            {/* Mobile search */}
            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                Search
              </label>

              <div className="relative mt-2">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />

                <input
                  value={q}
                  onChange={(e) =>
                    setQ(
                      e.target.value,
                    )
                  }
                  placeholder="Search groceries"
                  className="h-11 w-full rounded-xl border border-line bg-bg pl-9 pr-3 text-sm"
                />
              </div>
            </div>

            {/* Mobile categories */}
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Category
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {categoryList.map(
                  (category) => (
                    <button
                      key={
                        category.slug
                      }
                      onClick={() =>
                        setCat(
                          category.slug,
                        )
                      }
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left text-sm transition",
                        cat ===
                          category.slug
                          ? "border-brand bg-brand-soft font-semibold text-brand"
                          : "border-line hover:bg-surface-2",
                      )}
                    >
                      {
                        category.emoji
                      }{" "}
                      {
                        category.name
                      }
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Mobile price */}
            <div className="mt-6">
              <div className="flex justify-between">
                <p className="text-sm font-semibold">
                  Maximum price
                </p>

                <span className="text-sm font-semibold text-brand">
                  ₹
                  {max.toLocaleString(
                    "en-IN",
                  )}
                </span>
              </div>

              <input
                type="range"
                min={200}
                max={100000}
                value={max}
                onChange={(e) =>
                  setMax(
                    Number(
                      e.target.value,
                    ),
                  )
                }
                className="mt-4 w-full accent-[var(--brand)]"
              />
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={
                  clearFilters
                }
                className="flex-1 rounded-xl border border-line px-4 py-3 text-sm font-semibold"
              >
                Clear all
              </button>

              <button
                onClick={() =>
                  setMobileFilters(
                    false,
                  )
                }
                className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white"
              >
                Show {list.length} products
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}