export type CampaignInventory = {
  stock_quantity: number;
  reserved_quantity: number;
};

export type CampaignVariant = {
  id: string;
  variant_name: string;
  mrp: number;
  selling_price: number;
  gst_rate: number;
  active: boolean;
  inventory: CampaignInventory[] | CampaignInventory | null;
};

export type CampaignProductImage = {
  id?: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
};

export type CampaignProductRecord = {
  id: string;
  name: string;
  brand: string | null;
  category_id?: string | null;
  subcategory?: string | null;
  description?: string | null;
  active?: boolean;
  rating?: number | null;
  review_count?: number | null;
  categories?: { id: string; name: string } | { id: string; name: string }[] | null;
  product_variants?: CampaignVariant[];
  product_images?: CampaignProductImage[];
};

export type CampaignProductItem = {
  id: string;
  product_id: string;
  festive_discount: number;
  display_order: number;
  products: CampaignProductRecord | CampaignProductRecord[] | null;
};

export type FestivalCampaign = {
  id: string;
  festival_name: string;
  campaign_name: string;
  heading: string | null;
  subtitle: string | null;
  theme: string;
  background_color: string | null;
  button_text: string | null;
  start_date?: string | null;
  end_date?: string | null;
  campaign_products: CampaignProductItem[];
};

export type FestiveProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  unit: string;
  image: string;
  price: number;
  mrp: number;
  stock: number;
  active: boolean;
  rating: number;
  reviewCount: number;
  variantId?: string;
  festiveDiscount: number;
  displayOrder: number;
};

export const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=70";

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function inventoryList(
  inventory: CampaignVariant["inventory"],
): CampaignInventory[] {
  if (!inventory) return [];
  return Array.isArray(inventory) ? inventory : [inventory];
}

function availableStock(variant: CampaignVariant | undefined) {
  if (!variant) return 0;
  return inventoryList(variant.inventory).reduce(
    (total, item) =>
      total +
      Math.max(
        0,
        Number(item.stock_quantity || 0) - Number(item.reserved_quantity || 0),
      ),
    0,
  );
}

export function clampDiscount(value: unknown) {
  const discount = Number(value || 0);
  if (!Number.isFinite(discount)) return 0;
  return Math.min(90, Math.max(0, Math.round(discount * 100) / 100));
}

export function mapCampaignProducts(
  campaign: FestivalCampaign | null | undefined,
): FestiveProduct[] {
  return (campaign?.campaign_products ?? [])
    .map((item): FestiveProduct | null => {
      const product = first(item.products);
      if (!product || product.active === false) return null;

      const activeVariants = (product.product_variants ?? []).filter(
        (variant) => variant.active !== false,
      );

      const selectedVariant =
        activeVariants.find((variant) => availableStock(variant) > 0) ||
        activeVariants[0];

      const images = [...(product.product_images ?? [])].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
      );

      const image =
        images.find((img) => img.is_primary)?.image_url ||
        images[0]?.image_url ||
        PLACEHOLDER_IMAGE;

      const categoryName = first(product.categories)?.name || "";

      return {
        id: product.id,
        name: product.name,
        brand: product.brand?.trim() || "",
        category: categoryName,
        categorySlug: categoryName.trim().toLowerCase(),
        unit: selectedVariant?.variant_name || product.subcategory || "",
        image,
        price: Number(selectedVariant?.selling_price || 0),
        mrp: Number(selectedVariant?.mrp || 0),
        stock: availableStock(selectedVariant),
        active: true,
        rating: Number(product.rating || 0),
        reviewCount: Number(product.review_count || 0),
        variantId: selectedVariant?.id,
        festiveDiscount: clampDiscount(item.festive_discount),
        displayOrder: Number(item.display_order || 0),
      };
    })
    .filter((item): item is FestiveProduct => item !== null);
}

export function maxCampaignDiscount(products: FestiveProduct[]) {
  return products.reduce(
    (max, product) => Math.max(max, product.festiveDiscount),
    0,
  );
}

export type FestiveCollection = {
  key: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  products: FestiveProduct[];
};

const MIN_COLLECTION_SIZE = 3;

export function buildFestiveCollections(
  products: FestiveProduct[],
  festivalName: string,
  options: { includeCategories?: boolean } = {},
): FestiveCollection[] {
  const collections: FestiveCollection[] = [];
  if (products.length === 0) return collections;

  const trending = [...products]
    .filter((product) => product.festiveDiscount > 0)
    .sort(
      (a, b) =>
        b.festiveDiscount - a.festiveDiscount || a.displayOrder - b.displayOrder,
    );

  collections.push({
    key: "trending",
    eyebrow: "Biggest festive badges",
    title: "Trending Festive Deals",
    subtitle: `Top ${festivalName} picks with the highest festive offers`,
    products: trending.length > 0 ? trending : products,
  });

  const bestSellers = [...products]
    .filter((product) => product.reviewCount > 0)
    .sort(
      (a, b) =>
        b.reviewCount - a.reviewCount || b.rating - a.rating,
    );

  if (bestSellers.length >= MIN_COLLECTION_SIZE) {
    collections.push({
      key: "best-sellers",
      eyebrow: "Loved by shoppers",
      title: "Best Sellers",
      subtitle: "Most-reviewed products in this festive collection",
      products: bestSellers,
    });
  }

  const topRated = [...products]
    .filter((product) => product.rating > 0)
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);

  if (topRated.length >= MIN_COLLECTION_SIZE && bestSellers.length < MIN_COLLECTION_SIZE) {
    collections.push({
      key: "popular",
      eyebrow: "Highly rated",
      title: "Popular Products",
      subtitle: "Shopper favourites based on ratings",
      products: topRated,
    });
  }

  if (options.includeCategories) {
    const byCategory = new Map<string, FestiveProduct[]>();
    for (const product of products) {
      if (!product.category) continue;
      const list = byCategory.get(product.category) ?? [];
      list.push(product);
      byCategory.set(product.category, list);
    }

    for (const [category, list] of byCategory) {
      if (list.length < MIN_COLLECTION_SIZE) continue;
      collections.push({
        key: `category-${category}`,
        eyebrow: "Special festival offers",
        title: `Festive ${category}`,
        subtitle: `Handpicked ${category.toLowerCase()} for your ${festivalName} celebrations`,
        products: list,
      });
    }
  }

  return collections;
}

export function showFallbackImage(event: { currentTarget: HTMLImageElement }) {
  const img = event.currentTarget;
  if (img.src !== PLACEHOLDER_IMAGE) img.src = PLACEHOLDER_IMAGE;
}
