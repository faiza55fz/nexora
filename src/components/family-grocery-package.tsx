"use client";

import { useEffect,useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { useStore } from "@/components/providers";

type PackageProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
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
  const { addToCart} =
    useStore();
    const { user } = useStore();

const [recommendedProducts, setRecommendedProducts] =
  useState<PackageProduct[]>([]);
const [packageProductsState, setPackageProductsState] =
  useState<PackageItem[]>([]);

  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!user?.id) {
      if (products && products.length > 0 && packageProductsState.length === 0) {
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
            (fetchedProducts.length > 0
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
   () => packageProductsState.map((item) => item.product),
  [packageProductsState],
);

  const packageTotal = packageProductsState.reduce(
    (total, item) => total + item.product.price * item.qty,
  0,);

  function addPackageToCart() {
  packageProductsState.forEach((item) => {
    addToCart(item.product.id, item.qty);
  });

  setOpen(true);
}

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand/5 via-surface to-brand-soft/30 p-5 sm:p-7 shadow-xs">
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
              🏠 Weekly Family Bundle
            </div>

            <h2 className="mt-2 text-xl sm:text-2xl font-bold text-ink">
              Your Family Grocery Package
            </h2>

            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted">
              We&apos;ve gathered products you regularly buy into one convenient weekly package. Customize items or add everything in 1 click.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-line bg-surface px-5 py-3 text-left sm:text-right shadow-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Package Value
            </p>

            <p className="text-xl sm:text-2xl font-bold text-brand">
              ₹{Math.round(packageTotal)}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {packageProducts.length} regular essentials
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {packageProducts.map((product) => {
            const qty =
              packageProductsState.find(
                (item) => item.product.id === product.id,
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
                  <p className="truncate text-xs font-semibold text-ink" title={product.name}>
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

        {products.some(
          (product) =>
            !packageProductsState.some(
              (item) => item.product.id === product.id,
            ),
        ) ? (
          <div className="mt-4 pt-3 border-t border-line/60">
            <p className="mb-2 text-xs font-semibold text-muted">
              Add removed essentials back:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {products
                .filter(
                  (product) =>
                    !packageProductsState.some(
                      (item) => item.product.id === product.id,
                    ),
                )
                .map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() =>
                      setPackageProductsState((current) => [
                        ...current,
                        {
                          product,
                          qty: 1,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:border-brand hover:text-brand"
                  >
                    + {product.name}
                  </button>
                ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            onClick={addPackageToCart}
            className="flex items-center gap-2 font-bold"
          >
            🛒 Add Package to Cart
          </Button>

          <Button
            variant="outline"
            onClick={() => setOpen((current) => !current)}
          >
            {open ? "Hide Details" : "Customize Package"}
          </Button>
        </div>

        {open ? (
          <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  Customize your package
                </h3>

                <p className="mt-1 text-xs text-muted">
                  Add your usual groceries and remove anything
                  you don't need.
                </p>
              </div>

              <span className="text-sm font-semibold text-brand">
                {packageProducts.length} items
              </span>
            </div>

           <div className="mt-4 space-y-2">
  {packageProducts.map((product) => (
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
      onClick={() => {
        setPackageProductsState((current) =>
          current
            .map((item) =>
              item.product.id === product.id
                ? {
                    ...item,
                    qty: Math.max(1, item.qty - 1),
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
        (item) => item.product.id === product.id,
      )?.qty ?? 1}
    </span>

    <Button
      variant="outline"
      onClick={() => {
        setPackageProductsState((current) =>
          current.map((item) =>
            item.product.id === product.id
              ? {
                  ...item,
                  qty: item.qty + 1,
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
        setPackageProductsState((current) =>
          current.filter(
            (item) => item.product.id !== product.id,
          ),
        );
      }}
    >
      Remove
    </Button>
  </div>
</div>
  ))}
</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}