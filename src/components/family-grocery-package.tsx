
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { useStore } from "@/components/providers";

type PackageProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  brand?: string;
};

type PackageItem = {
  product: PackageProduct;
  qty: number;
};

type FamilyGroceryPackageProps = {
  products: PackageProduct[];
};

export default function FamilyGroceryPackage({
  products,
}: FamilyGroceryPackageProps) {
  const { addToCart, user } = useStore();

  const [recommendedProducts, setRecommendedProducts] =
    useState<PackageProduct[]>([]);

  const [packageProductsState, setPackageProductsState] =
    useState<PackageItem[]>([]);

  const [open, setOpen] = useState(false);

  // Add-items search state
  const [showAddItems, setShowAddItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user?.id) {
      if (
        products &&
        products.length > 0 &&
        packageProductsState.length === 0
      ) {
        setPackageProductsState(
          products.slice(0, 6).map((product) => ({
            product,
            qty: 1,
          })),
        );
      }

      return;
    }

    fetch(
      `/api/customer/family-package?customerId=${user.id}`,
    )
      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          const fetchedProducts = result.products ?? [];

          setRecommendedProducts(fetchedProducts);

          setPackageProductsState(
            (
              fetchedProducts.length > 0
                ? fetchedProducts
                : products.slice(0, 6)
            ).map((product: PackageProduct) => ({
              product,
              qty: 1,
            })),
          );
        }
      })
      .catch((error) => {
        console.error(
          "Failed to load family grocery package:",
          error,
        );

        setPackageProductsState(
          products.slice(0, 6).map((product) => ({
            product,
            qty: 1,
          })),
        );
      });
  }, [user?.id, products]);

  const packageProducts = useMemo(
    () =>
      packageProductsState.map(
        (item) => item.product,
      ),
    [packageProductsState],
  );

  const packageTotal =
    packageProductsState.reduce(
      (total, item) =>
        total + item.product.price * item.qty,
      0,
    );

  /*
   * Products available for the search.
   *
   * Already-added family package products are
   * excluded from the search results.
   */
  const searchResults = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    if (!query) {
      return [];
    }

    return products
      .filter(
        (product) =>
          !packageProductsState.some(
            (item) =>
              item.product.id === product.id,
          ),
      )
      .filter((product) => {
        const name =
          product.name?.toLowerCase() || "";

        const brand =
          product.brand?.toLowerCase() || "";

        const category =
          product.category?.toLowerCase() || "";

        return (
          name.includes(query) ||
          brand.includes(query) ||
          category.includes(query)
        );
      })
      .slice(0, 8);
  }, [
    products,
    packageProductsState,
    searchQuery,
  ]);

  function addProductToPackage(
    product: PackageProduct,
  ) {
    setPackageProductsState((current) => {
      if (
        current.some(
          (item) =>
            item.product.id === product.id,
        )
      ) {
        return current;
      }

      return [
        ...current,
        {
          product,
          qty: 1,
        },
      ];
    });

    setSearchQuery("");
  }

  function addPackageToCart() {
    packageProductsState.forEach((item) => {
      addToCart(
        item.product.id,
        item.qty,
      );
    });

    setOpen(true);
  }

  function closeAddItems() {
    setShowAddItems(false);
    setSearchQuery("");
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand/5 via-surface to-brand-soft/30 p-5 shadow-xs sm:p-7">
      <div className="relative">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
              🏠 Weekly Family Bundle
            </div>

            <h2 className="mt-2 text-xl font-bold text-ink sm:text-2xl">
              Your Family Grocery Package
            </h2>

            <p className="mt-1 max-w-2xl text-xs text-muted sm:text-sm">
              We&apos;ve gathered products you regularly buy
              into one convenient weekly package. Customize
              items or add everything in 1 click.
            </p>
          </div>

          {/* Package Value */}
          <div className="shrink-0 rounded-2xl border border-line bg-surface px-5 py-3 text-left shadow-xs sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Package Value
            </p>

            <p className="text-xl font-bold text-brand sm:text-2xl">
              ₹{Math.round(packageTotal)}
            </p>

            <p className="mt-0.5 text-xs text-muted">
              {packageProducts.length} regular essentials
            </p>
          </div>
        </div>

        {/* Current Package Products */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {packageProducts.map((product) => {
            const qty =
              packageProductsState.find(
                (item) =>
                  item.product.id === product.id,
              )?.qty ?? 1;

            return (
              <div
                key={product.id}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-surface p-2.5 transition hover:shadow-xs"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-surface-2">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-3xl">
                      🛒
                    </div>
                  )}

                  {qty > 1 ? (
                    <span className="absolute bottom-1 right-1 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                      ×{qty}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-semibold text-ink"
                    title={product.name}
                  >
                    {product.name}
                  </p>

                  <p className="mt-1 text-xs font-bold text-brand">
                    ₹{product.price * qty}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ADD ITEMS */}
        <div className="mt-5 border-t border-line/60 pt-4">
          {!showAddItems ? (
            <button
              type="button"
              onClick={() =>
                setShowAddItems(true)
              }
              className="group inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[#34254C]/15 bg-white px-5 py-2.5 text-sm font-extrabold text-[#34254C] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#E9573F] hover:bg-[#FFF0C2] hover:shadow-md active:translate-y-0"
            >
              <span className="text-base">
                +
              </span>
              Add items
            </button>
          ) : (
            <div className="rounded-2xl border border-brand/20 bg-surface p-4 shadow-xs">
              {/* Search Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink sm:text-base">
                    Add items to your family package
                  </h3>

                  <p className="mt-0.5 text-xs text-muted">
                    Search for any grocery you want to
                    include.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeAddItems}
                  className="self-start rounded-full bg-[#34254C] px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#E9573F] active:translate-y-0"
                >
                  Done
                </button>
              </div>

              {/* Search Input */}
              <div className="relative mt-4">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  🔍
                </span>

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search for products..."
                  autoFocus
                  className="h-11 w-full rounded-xl border border-line bg-surface-2 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </div>

              {/* Search Results */}
              {searchQuery.trim() ? (
                <div className="mt-3 space-y-2">
                  {searchResults.length > 0 ? (
                    searchResults.map(
                      (product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5"
                        >
                          {/* Product Image */}
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                            {product.image ? (
                              <img
                                src={
                                  product.image
                                }
                                alt={
                                  product.name
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full place-items-center text-xl">
                                🛒
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm font-semibold text-ink"
                              title={
                                product.name
                              }
                            >
                              {product.name}
                            </p>

                            {product.brand ? (
                              <p className="truncate text-xs text-muted">
                                {
                                  product.brand
                                }
                              </p>
                            ) : null}

                            <p className="mt-0.5 text-xs font-bold text-brand">
                              ₹
                              {product.price}
                            </p>
                          </div>

                          {/* Add Button */}
                          <button
                            type="button"
                            onClick={() =>
                              addProductToPackage(
                                product,
                              )
                            }
                            className="shrink-0 rounded-full bg-gradient-to-r from-[#E9573F] to-[#F47A45] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_3px_0_#B83D2D] transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_0_#B83D2D] active:translate-y-0 active:shadow-none"
                          >
                            + Add
                          </button>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center">
                      <p className="text-sm font-semibold text-ink">
                        No products found
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        Try searching with a different
                        product name or brand.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 rounded-xl bg-surface-2 px-4 py-5 text-center">
                  <p className="text-sm font-semibold text-ink">
                    Search for an item
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Type a product name, brand, or category
                    above.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Package Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            onClick={addPackageToCart}
            className="!min-h-12 !rounded-full !border-0 !bg-gradient-to-r !from-[#E9573F] !to-[#F47A45] !px-7 !py-3 !text-sm !font-extrabold !text-white !shadow-[0_5px_0_#B83D2D] transition-all duration-200 hover:!-translate-y-1 hover:!shadow-[0_8px_0_#B83D2D] active:!translate-y-0 active:!shadow-none"
          >
            🛒 Add Package to Cart
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              setOpen(
                (current) => !current,
              )
            }
              className="!min-h-12 !rounded-full !border-2 !border-[#34254C] !bg-[#FFF0C2] !px-6 !py-3 !text-sm !font-extrabold !text-[#34254C] shadow-sm transition-all hover:!-translate-y-0.5 hover:!bg-[#34254C] hover:!text-white"
          >
            {open
              ? "Hide Details"
              : "Customize Package"}
          </Button>
        </div>

        {/* Customize Package */}
        {open ? (
          <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  Customize your package
                </h3>

                <p className="mt-1 text-xs text-muted">
                  Add your usual groceries and remove
                  anything you don&apos;t need.
                </p>
              </div>

              <span className="text-sm font-semibold text-brand">
                {packageProducts.length} items
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {packageProducts.map(
                (product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {product.name}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                         className="!h-9 !min-h-9 !w-9 !rounded-full !border-2 !border-[#34254C]/20 !bg-white !p-0 !text-base !font-black !text-[#34254C] transition-all hover:!border-[#E9573F] hover:!bg-[#FFF0C2]"
                        onClick={() => {
                          setPackageProductsState(
                            (current) =>
                              current.map(
                                (item) =>
                                  item.product.id ===
                                  product.id
                                    ? {
                                        ...item,
                                        qty: Math.max(
                                          1,
                                          item.qty - 1,
                                        ),
                                      }
                                    : item,
                              ),
                          );
                        }}
                      >
                        −
                      </Button>

                      <span className="w-6 text-center text-sm font-semibold">
                        {packageProductsState.find(
                          (item) =>
                            item.product.id ===
                            product.id,
                        )?.qty ?? 1}
                      </span>

                      <Button
                        variant="outline"
                        className="!h-9 !min-h-9 !w-9 !rounded-full !border-2 !border-[#34254C]/20 !bg-white !p-0 !text-base !font-black !text-[#34254C] transition-all hover:!border-[#E9573F] hover:!bg-[#FFF0C2]"
                        onClick={() => {
                          setPackageProductsState(
                            (current) =>
                              current.map(
                                (item) =>
                                  item.product.id ===
                                  product.id
                                    ? {
                                        ...item,
                                        qty:
                                          item.qty +
                                          1,
                                      }
                                    : item,
                              ),
                          );
                        }}
                      >
                        +
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setPackageProductsState(
                            (current) =>
                              current.filter(
                                (item) =>
                                  item.product.id !==
                                  product.id,
                              ),
                          );
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
