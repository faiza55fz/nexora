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
  if (!user?.id) return;

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
}, [user?.id]);

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
    <section className="relative overflow-hidden rounded-3xl border border-brand/20 bg-brand/5 p-5 sm:p-7">
      <div className="pointer-events-none absolute -right-10 -top-10 text-[7rem] opacity-10">
        🛒
      </div>

      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand">
                  🏠 Personalized from your purchases

            </p>

            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              Your Family Grocery Package
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
               We've gathered products you regularly buy into one
  convenient family package. Add, remove or customize
  anything you need.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-surface px-4 py-3 text-right shadow-sm">
            <p className="text-xs text-muted">
              Package value
            </p>

            <p className="text-2xl font-bold text-brand">
              ₹{Math.round(packageTotal)}
            </p>
            <p className="mt-1 text-xs text-muted">
  {packageProducts.length} regular items
</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packageProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden border-line bg-surface"
            >
              <div className="flex items-center gap-3 p-3">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-2 text-2xl">
                    🛒
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {product.name}
                  </p>

                  <p className="mt-1 text-sm font-bold text-brand">
                    ₹{product.price * (packageProductsState.find(
  (item) => item.product.id === product.id,
)?.qty ?? 1)}
                  </p>
                </div>
              </div>
            </Card>
          ))
          
          }
        </div>
                {products.some(
          (product) =>
            !packageProductsState.some(
              (item) => item.product.id === product.id,
            ),
        ) ? (
          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold">
              Add products back
            </p>

            <div className="flex flex-wrap gap-2">
              {products
                .filter(
                  (product) =>
                    !packageProductsState.some(
                      (item) => item.product.id === product.id,
                    ),
                )
                .map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    onClick={() =>
                      setPackageProductsState((current) => [
                        ...current,
                        {
                          product,
                          qty: 1,
                        },
                      ])
                    }
                  >
                    + {product.name}
                  </Button>
                ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={addPackageToCart}>
            🛒 Add package to cart
          </Button>

          <Button
            variant="outline"
            onClick={() => setOpen((current) => !current)}
          >
            {open ? "Hide package" : "Customize package"}
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