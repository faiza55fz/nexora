import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get products using the same structure as the working products API
    const { data: products, error: productsError } =
      await supabase
        .from("products")
        .select(`
          *,
          categories (
            name
          ),
          product_images (
            image_url,
            is_primary
          ),
          product_variants (
            id,
            variant_name,
            mrp,
            selling_price,
            active,
            gst_rate,
            inventory (
              stock_quantity
            )
          )
        `);

    if (productsError) {
      throw productsError;
    }

    if (!products || products.length === 0) {
      return NextResponse.json([]);
    }

    // Convert products into the format used by the recommendation component
    const activeProducts = products
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

        const inventory = variant?.inventory;

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
          price: Number(
            variant?.selling_price || 0,
          ),
          mrp: Number(
            variant?.mrp || 0,
          ),
          category:
            product.categories?.name ||
            product.category ||
            null,
          rating: Number(
            product.rating || 0,
          ),
          stock: Number(
            inventory?.stock_quantity || 0,
          ),
        };
      });

    if (activeProducts.length === 0) {
      return NextResponse.json([]);
    }

    // ---------------------------------------------------------
    // Guest users
    // ---------------------------------------------------------

    if (!userId) {
      return NextResponse.json(
        activeProducts
          .filter(
            (product: any) =>
              product.stock > 0,
          )
          .slice(0, 12),
      );
    }

    // ---------------------------------------------------------
    // Get customer activity
    // ---------------------------------------------------------

    const {
      data: activities,
      error: activitiesError,
    } = await supabase
      .from("customer_product_activity")
      .select(`
        product_id,
        activity_type,
        activity_count,
        last_activity_at
      `)
      .eq("customer_id", userId);

    if (activitiesError) {
      console.error(
        "Customer activity lookup failed:",
        activitiesError,
      );
    }

    // ---------------------------------------------------------
    // Build personalization scores
    // ---------------------------------------------------------

    const productScores = new Map<
      string,
      number
    >();

    const productActivity = new Map<
      string,
      {
        search: number;
        view: number;
        cart: number;
        wishlist: number;
        purchase: number;
      }
    >();

    for (const activity of activities || []) {
      const productId =
        activity.product_id;

      if (!productId) {
        continue;
      }

      const current =
        productActivity.get(
          productId,
        ) || {
          search: 0,
          view: 0,
          cart: 0,
          wishlist: 0,
          purchase: 0,
        };

      const count = Number(
        activity.activity_count || 0,
      );

      if (
        activity.activity_type ===
        "search"
      ) {
        current.search += count;
      }

      if (
        activity.activity_type ===
        "view"
      ) {
        current.view += count;
      }

      if (
        activity.activity_type ===
        "cart"
      ) {
        current.cart += count;
      }

      if (
        activity.activity_type ===
        "wishlist"
      ) {
        current.wishlist += count;
      }

      if (
        activity.activity_type ===
        "purchase"
      ) {
        current.purchase += count;
      }

      productActivity.set(
        productId,
        current,
      );
    }

    // ---------------------------------------------------------
    // Find customer's preferred categories
    // ---------------------------------------------------------

    const categoryScores =
      new Map<string, number>();

    for (const product of activeProducts) {
      const activity =
        productActivity.get(
          product.id,
        );

      if (!activity) {
        continue;
      }

      if (!product.category) {
        continue;
      }

      const activityScore =
        activity.search * 3 +
        activity.view * 2 +
        activity.cart * 5 +
        activity.wishlist * 6 +
        activity.purchase * 10;

      categoryScores.set(
        product.category,
        (categoryScores.get(
          product.category,
        ) || 0) + activityScore,
      );
    }

    // ---------------------------------------------------------
    // Score every product
    // ---------------------------------------------------------

    const recommendations =
      activeProducts
        .filter(
          (product: any) =>
            product.stock > 0,
        )
        .map((product: any) => {
          let score = 0;

          const activity =
            productActivity.get(
              product.id,
            ) || {
              search: 0,
              view: 0,
              cart: 0,
              wishlist: 0,
              purchase: 0,
            };

          // Direct customer behaviour
          score +=
            activity.search * 3;

          score +=
            activity.view * 2;

          score +=
            activity.cart * 5;

          score +=
            activity.wishlist * 6;

          score +=
            activity.purchase * 10;

          // Preferred category
          if (product.category) {
            score +=
              (categoryScores.get(
                product.category,
              ) || 0) * 0.5;
          }

          // In stock
          if (product.stock > 0) {
            score += 5;
          }

          // Rating
          if (product.rating > 0) {
            score += Number(
              product.rating,
            );
          }

          // Discount
          if (
            product.mrp > 0 &&
            product.mrp >
              product.price
          ) {
            score += 3;
          }

          return {
            ...product,
            recommendation_score:
              score,
          };
        });

    // ---------------------------------------------------------
    // Sort by personalization score
    // ---------------------------------------------------------

    recommendations.sort(
      (a: any, b: any) =>
        b.recommendation_score -
        a.recommendation_score,
    );

    // ---------------------------------------------------------
    // If there is not enough activity yet,
    // fall back to generally useful products.
    // ---------------------------------------------------------

    if (
      recommendations.length === 0
    ) {
      return NextResponse.json(
        activeProducts
          .filter(
            (product: any) =>
              product.stock > 0,
          )
          .sort(
            (a: any, b: any) =>
              Number(
                b.rating || 0,
              ) -
              Number(
                a.rating || 0,
              ),
          )
          .slice(0, 12),
      );
    }

    return NextResponse.json(
      recommendations.slice(0, 12),
    );
  } catch (error) {
    console.error(
      "Recommendation API error:",
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