"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, Button } from "@/components/ui";
import { useStore } from "@/components/providers";
import { ProductCard } from "@/components/product-card";

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
      <section className="pt-8 sm:pt-10">
        <div className="mb-4">
          <div className="h-6 w-48 animate-pulse rounded bg-surface-2" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-surface-2" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-2xl bg-surface-2"
            />
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
    <section className="pt-8 sm:pt-10">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            Curated For You
          </span>
          <h2 className="mt-0.5 text-xl sm:text-2xl font-bold text-ink">
            Recommended for you
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            {user
              ? "Handpicked based on your recent grocery preferences"
              : "Popular everyday groceries shoppers love"}
          </p>
        </div>

        <Link
          href="/products"
          className="shrink-0 text-xs sm:text-sm font-semibold text-brand hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {products.slice(0, 10).map((product) => {
          const cardProduct = {
            id: product.id,
            slug: product.id,
            name: product.name,
            brand: "SundayShop",
            category: product.category || "groceries",
            subcategory: "",
            image:
              product.image ||
              "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80",
            images: [
              product.image ||
                "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80",
            ],
            price: Number(product.price) || 0,
            mrp:
              Number(product.mrp) ||
              Number(product.price) ||
              0,
            gstRate: 0,
            rating: 4.8,
            reviewCount: 84,
            sold: 320,
            sellerId: "SundayShop",
            stock: 100,
            deliveryEta: "Tomorrow",
            location: "",
            tags: [],
            highlights: [],
            description: "",
            specs: { Unit: "1 pack" },
            moq: 1,
            tiers: [],
          };

          return (
            <ProductCard
              key={product.id}
              product={cardProduct}
            />
          );
        })}
      </div>
    </section>
  );
}