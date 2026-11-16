
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui";
import type { Product } from "@/lib/types";

type FestivalCampaign = {
  id: string;
  festival_name: string;
  campaign_name: string;
  heading: string | null;
  subtitle: string | null;
  theme: string;
  background_color: string | null;
  button_text: string | null;
  campaign_products: {
    id: string;
    product_id: string;
    festive_discount: number;
    display_order: number;
    products: {
      id: string;
      name: string;
      brand: string | null;
      category_id: string | null;
      subcategory: string | null;
      description: string | null;
      active: boolean;
      rating: number | null;
      review_count: number | null;
      categories: { id: string; name: string } | null;
      product_variants: {
        id: string;
        variant_name: string;
        mrp: number;
        selling_price: number;
        gst_rate: number;
        active: boolean;
        inventory: {
          stock_quantity: number;
          reserved_quantity: number;
        }[];
      }[];
      product_images: {
        id: string;
        image_url: string;
        display_order: number;
        is_primary: boolean;
      }[];
    } | null;
  }[];
};

type CampaignProduct = Product & {
  variantId?: string;
  maxOrderQuantity?: number;
};

type CampaignVariant = {
  id: string;
  variant_name: string;
  mrp: number;
  selling_price: number;
  gst_rate: number;
  active: boolean;
  inventory: {
    stock_quantity: number;
    reserved_quantity: number;
  }[];
};

export default function FestivalOffersPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;

  const [campaign, setCampaign] = useState<FestivalCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const products: {
    product: CampaignProduct;
    discount: number;
  }[] = (campaign?.campaign_products ?? [])
    .map((item) => {
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;

      if (!product) return null;

const variants = product.product_variants as CampaignVariant[];

const activeVariants = variants.filter(
  (variant: CampaignVariant) => variant.active !== false,
);

const selectedVariant =
  activeVariants.find((variant: CampaignVariant) =>
    variant.inventory.some(
      (stock) =>
        stock.stock_quantity - stock.reserved_quantity > 0,
    ),
  ) || activeVariants[0];

const stock =
  selectedVariant?.inventory.reduce(
    (total: number, inventory) =>
      total +
      Math.max(
        0,
        inventory.stock_quantity - inventory.reserved_quantity,
      ),
    0,
  ) ?? 0;

      const images = [...product.product_images].sort(
        (a, b) => a.display_order - b.display_order,
      );

      const primaryImage =
        images.find((image) => image.is_primary)?.image_url ||
        images[0]?.image_url ||
        "/placeholder.png";

      const mappedProduct: CampaignProduct = {
        id: product.id,
        name: product.name,
        brand: product.brand || "",
        category: product.categories?.name || "",
        subcategory: product.subcategory || "",
        description: product.description || "",
        image: primaryImage,
        images: images.map((image) => image.image_url),
        price: Number(selectedVariant?.selling_price || 0),
        mrp: Number(selectedVariant?.mrp || 0),
        stock,
        active: product.active,
        rating: Number(product.rating || 0),
        reviewCount: Number(product.review_count || 0),
        moq: 1,
        tiers: [],
        specs: {},
        variantId: selectedVariant?.id,
        maxOrderQuantity: stock,
      }as unknown as CampaignProduct;

      return {
        product: mappedProduct,
        discount: Number(item.festive_discount || 0),
      };
    })
    .filter(
      (item): item is { product: CampaignProduct; discount: number } =>
        item !== null,
    );

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center">
        Loading festival offers...
      </main>
    );
  }

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
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
      <div
        className="overflow-hidden rounded-2xl px-5 py-10 sm:px-10 sm:py-14"
        style={{
          backgroundColor: campaign.background_color || "#FFF0D9",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-cta">
          {campaign.festival_name} Specials
        </p>

        <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-5xl">
          {campaign.heading || campaign.campaign_name}
        </h1>

        {campaign.subtitle && (
          <p className="mt-3 max-w-2xl text-sm text-ink/80 sm:text-base">
            {campaign.subtitle}
          </p>
        )}

        <p className="mt-5 text-sm font-semibold text-ink">
          Celebrate more. Save more!
        </p>
      </div>

      <div className="mb-5 mt-8">
        <h2 className="text-xl font-bold text-ink sm:text-2xl">
          Shop {campaign.festival_name} Offers
        </h2>
        <p className="mt-1 text-sm text-muted">
          Special savings on products selected for this festival.
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map(({ product, discount }) => (
            <ProductCard
              key={product.id}
              product={product}
              showFestivePrice
              campaignDiscount={discount}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-line p-10 text-center">
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
