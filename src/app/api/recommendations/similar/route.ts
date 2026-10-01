import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        {
          error: "productId is required.",
        },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get the current product
    const { data: currentProduct, error: currentProductError } =
      await supabase
        .from("products")
        .select(`
          id,
          name,
          category_id,
          product_variants (
            selling_price,
            mrp,
            active
          )
        `)
        .eq("id", productId)
        .maybeSingle();

    if (currentProductError) {
      throw currentProductError;
    }

    if (!currentProduct) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        { status: 404 },
      );
    }

    // Get current product category
    let currentCategory: string | null = null;

    if (currentProduct.category_id) {
      const { data: category, error: categoryError } =
        await supabase
          .from("categories")
          .select("id, name")
          .eq("id", currentProduct.category_id)
          .maybeSingle();

      if (categoryError) {
        console.error(
          "Current category lookup failed:",
          categoryError,
        );
      }

      currentCategory = category?.name ?? null;
    }

    // Get current product price
    const currentVariant =
      currentProduct.product_variants?.find(
        (variant: any) => variant.active !== false,
      ) ||
      currentProduct.product_variants?.[0];

    const currentPrice = Number(
      currentVariant?.selling_price || 0,
    );

    const currentCategoryName =
      currentCategory?.toLowerCase().trim() || "";

    // Fruits and vegetables are treated as related
    // because they are both fresh produce.
    const getCategoryFamily = (
      category: string | null,
    ) => {
      const value =
        category?.toLowerCase().trim() || "";

      if (
        value === "fruits" ||
        value === "vegetables"
      ) {
        return "produce";
      }

      if (
        value === "dairy" ||
        value === "milk"
      ) {
        return "dairy";
      }

      return value;
    };

    const currentCategoryFamily =
      getCategoryFamily(currentCategoryName);

    // Get other active products
    const { data: products, error: productsError } =
      await supabase
        .from("products")
        .select(`
          id,
          name,
          category_id,
          rating,
          active,
          product_images (
            image_url,
            is_primary
          ),
          product_variants (
            id,
            selling_price,
            mrp,
            active,
            inventory (
              stock_quantity
            )
          )
        `)
        .neq("id", productId);

    if (productsError) {
      throw productsError;
    }

    if (!products || products.length === 0) {
      return NextResponse.json([]);
    }

    // Get all category IDs used by the products
    const categoryIds = [
      ...new Set(
        products
          .map(
            (product: any) =>
              product.category_id,
          )
          .filter(Boolean),
      ),
    ];

    const categoryMap = new Map<
      string,
      string
    >();

    if (categoryIds.length > 0) {
      const { data: categories, error: categoriesError } =
        await supabase
          .from("categories")
          .select("id, name")
          .in("id", categoryIds);

      if (categoriesError) {
        console.error(
          "Category lookup failed:",
          categoriesError,
        );
      }

      for (const category of categories || []) {
        categoryMap.set(
          category.id,
          category.name,
        );
      }
    }

    // Build similar products
    const recommendations = products
      .filter(
        (product: any) =>
          product.active !== false,
      )
      .map((product: any) => {
        const variant =
          product.product_variants?.find(
            (item: any) =>
              item.active !== false,
          ) ||
          product.product_variants?.[0];

        const inventory =
          variant?.inventory;

        const stock = Number(
          inventory?.stock_quantity || 0,
        );

        const price = Number(
          variant?.selling_price || 0,
        );

        const mrp = Number(
          variant?.mrp || 0,
        );

        const category =
          categoryMap.get(
            product.category_id,
          ) || null;

        const categoryName =
          category?.toLowerCase().trim() || "";

        const categoryFamily =
          getCategoryFamily(
            categoryName,
          );

        let score = 0;

        // Same category
        if (
          currentProduct.category_id &&
          product.category_id ===
            currentProduct.category_id
        ) {
          score += 10;
        }
        // Related category
        else if (
          currentCategoryFamily &&
          categoryFamily &&
          currentCategoryFamily ===
            categoryFamily
        ) {
          score += 5;
        }

        // Similar price
        if (
          currentPrice > 0 &&
          price > 0
        ) {
          const priceDifference =
            Math.abs(
              price - currentPrice,
            ) / currentPrice;

          if (
            priceDifference <= 0.2
          ) {
            score += 4;
          } else if (
            priceDifference <= 0.4
          ) {
            score += 2;
          }
        }

        // In stock
        if (stock > 0) {
          score += 5;
        }

        // Discount
        if (
          mrp > 0 &&
          mrp > price
        ) {
          score += 3;
        }

        // Rating
        if (
          Number(product.rating || 0) > 0
        ) {
          score += Math.min(
            Number(product.rating),
            5,
          );
        }

        const primaryImage =
          product.product_images?.find(
            (image: any) =>
              image.is_primary,
          )?.image_url ||
          product.product_images?.[0]
            ?.image_url ||
          null;

        return {
          id: product.id,
          name: product.name,
          image: primaryImage,
          price,
          mrp,
          category,
          rating: Number(
            product.rating || 0,
          ),
          stock,
          similarity_score: score,
        };
      })
      .filter(
        (product: any) =>
          product.stock > 0,
      );

    // Highest similarity first
    recommendations.sort(
      (a: any, b: any) =>
        b.similarity_score -
        a.similarity_score,
    );

    return NextResponse.json(
      recommendations.slice(0, 8),
    );
  } catch (error) {
    console.error(
      "Similar recommendations API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : JSON.stringify(error),
      },
      { status: 500 },
    );
  }
}