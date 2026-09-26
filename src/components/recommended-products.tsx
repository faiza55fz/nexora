"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, Button } from "@/components/ui";
import { useStore } from "@/components/providers";

type Product = {
  id: string;
  name: string;
  image?: string | null;
  price: number;
  mrp?: number | null;
  category?: string | null;
};

export default function RecommendedProducts() {
  const { user } = useStore();
  console.log("Recommendation user:", user);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        setLoading(true);

        const url = user?.id
          ? `/api/recommendations?userId=${encodeURIComponent(
              user.id,
            )}`
          : "/api/recommendations";

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            "Failed to load recommendations",
          );
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error(
          "Recommendation loading error:",
          error,
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [user?.id]);

  /*
   * Loading state
   */
  if (loading) {
    return (
      <section className="py-8">
        <div className="mb-5">
          <div className="h-7 w-56 animate-pulse rounded bg-muted/20" />

          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted/20" />
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card
              key={index}
              className="h-72 animate-pulse bg-muted/10"
            >
              <div className="h-full w-full" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  /*
   * Nothing to show
   */
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="mb-5">
        <h2 className="text-2xl font-bold">
          Recommended for you
        </h2>

        <p className="mt-1 text-sm text-muted">
          {user
            ? "Picked based on your shopping preferences"
            : "Popular products you may like"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {products.map((product) => (
          <Card
            key={product.id}
            className="overflow-hidden transition hover:-translate-y-1 hover:shadow-[var(--shadow)]"
          >
            <Link href={`/products/${product.id}`}>
              <div className="aspect-square overflow-hidden bg-muted/10">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-4xl">
                    🛒
                  </div>
                )}
              </div>

              <div className="p-3">
                <p className="line-clamp-2 min-h-10 text-sm font-semibold">
                  {product.name}
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="font-bold">
                    ₹{product.price}
                  </span>

                  {product.mrp &&
                    product.mrp > product.price && (
                      <span className="text-xs text-muted line-through">
                        ₹{product.mrp}
                      </span>
                    )}
                </div>

                {product.category && (
                  <p className="mt-1 text-xs text-muted">
                    {product.category}
                  </p>
                )}
              </div>
            </Link>
          </Card>
        ))}
      </div>

      <div className="mt-5 text-center">
        <Link href="/products">
          <Button variant="outline">
            Explore more products
          </Button>
        </Link>
      </div>
    </section>
  );
}