import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 },
      );
    }

    // Get products most frequently purchased together
    const { data: pairs, error: pairsError } =
      await supabaseAdmin
        .from("product_purchase_pairs")
        .select(
          "paired_product_id, purchase_count",
        )
        .eq("product_id", productId)
        .order("purchase_count", {
          ascending: false,
        })
        .limit(8);

    if (pairsError) {
      console.error(
        "Frequently bought together lookup failed:",
        pairsError,
      );

      return NextResponse.json(
        { error: "Unable to load recommendations." },
        { status: 500 },
      );
    }

    if (!pairs || pairs.length === 0) {
      return NextResponse.json([]);
    }

    const pairedProductIds = pairs.map(
      (pair) => pair.paired_product_id,
    );

    // Load the actual product information
    const { data: products, error: productsError } =
      await supabaseAdmin
        .from("products")
        .select(
          `
            id,
            name,
            description,
            category_id,
            product_images (
              image_url,
              is_primary
            ),
            product_variants (
              selling_price,
              mrp,
              active,
              inventory (
                stock_quantity
              )
            )
          `,
        )
        .in("id", pairedProductIds);

    if (productsError) {
      console.error(
        "Frequently bought together products lookup failed:",
        productsError,
      );

      return NextResponse.json(
        { error: "Unable to load products." },
        { status: 500 },
      );
    }

    // Load category names
    const categoryIds = [
      ...new Set(
        (products ?? [])
          .map((product) => product.category_id)
          .filter(Boolean),
      ),
    ];

    const { data: categories } =
      categoryIds.length > 0
        ? await supabaseAdmin
            .from("categories")
            .select("id, name")
            .in("id", categoryIds)
        : { data: [] };

    const categoryMap = new Map(
      (categories ?? []).map((category) => [
        category.id,
        category.name,
      ]),
    );

    const productMap = new Map(
      (products ?? []).map((product) => [
        product.id,
        product,
      ]),
    );

    const result = pairs
      .map((pair) => {
        const product = productMap.get(
          pair.paired_product_id,
        );

        if (!product) {
          return null;
        }

        const variants =
          Array.isArray(product.product_variants)
            ? product.product_variants
            : [];

        const activeVariant =
          variants.find(
            (variant) => variant.active !== false,
          ) ?? variants[0];

        const inventory = activeVariant?.inventory as
  | { stock_quantity?: number | null }
  | { stock_quantity?: number | null }[]
  | null
  | undefined;

const stock = Array.isArray(inventory)
  ? Number(inventory[0]?.stock_quantity ?? 0)
  : Number(inventory?.stock_quantity ?? 0);

        if (stock <= 0) {
          return null;
        }

        const images =
          Array.isArray(product.product_images)
            ? product.product_images
            : [];

        const primaryImage =
          images.find(
            (image) => image.is_primary,
          ) ?? images[0];

        return {
          id: product.id,
          name: product.name,
          image:
            primaryImage?.image_url ?? null,
          price: Number(
            activeVariant?.selling_price ?? 0,
          ),
          mrp: Number(
            activeVariant?.mrp ??
              activeVariant?.selling_price ??
              0,
          ),
          category:
            categoryMap.get(
              product.category_id,
            ) ?? "Grocery",
          stock,
          purchase_count:
            pair.purchase_count,
        };
      })
      .filter(Boolean)
      .slice(0, 4);

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "GET /api/recommendations/frequently-bought-together error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load frequently bought together products.",
      },
      { status: 500 },
    );
  }
}