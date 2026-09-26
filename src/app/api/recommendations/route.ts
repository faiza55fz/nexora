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
    const { data: products, error: productsError } = await supabase
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
      .filter((product: any) => product.active !== false)
      .map((product: any) => {
        const variant =
          product.product_variants?.find(
            (item: any) => item.active !== false,
          ) || product.product_variants?.[0];

        const inventory = variant?.inventory;

        const primaryImage =
          product.product_images?.find(
            (image: any) => image.is_primary,
          )?.image_url ||
          product.product_images?.[0]?.image_url ||
          null;

        return {
          id: product.id,
          name: product.name,
          image: primaryImage,
          price: Number(variant?.selling_price || 0),
          mrp: Number(variant?.mrp || 0),
          category:
            product.categories?.name ||
            product.category ||
            null,
          rating: Number(product.rating || 0),
          stock: Number(inventory?.stock_quantity || 0),
        };
      });

    if (activeProducts.length === 0) {
      return NextResponse.json([]);
    }

    // Guest users: show available products
    if (!userId) {
      return NextResponse.json(activeProducts.slice(0, 12));
    }

    // ---------------------------------------------------------
    // Find the logged-in user's email
    // ---------------------------------------------------------

    const { data: authUserData, error: authUserError } =
      await supabase.auth.admin.getUserById(userId);

    if (authUserError) {
      throw authUserError;
    }

    const userEmail = authUserData.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        activeProducts.slice(0, 12),
      );
    }

    // ---------------------------------------------------------
    // Find this customer's orders using customer_email
    // ---------------------------------------------------------

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id")
      .eq("customer_email", userEmail);

    if (ordersError) {
      throw ordersError;
    }

    const orderIds =
      orders?.map((order: any) => order.id) || [];

    // User has no previous orders
    if (orderIds.length === 0) {
      return NextResponse.json(
        activeProducts
          .filter((product: any) => product.stock > 0)
          .sort(
            (a: any, b: any) =>
              Number(b.rating || 0) -
              Number(a.rating || 0),
          )
          .slice(0, 12),
      );
    }

    // ---------------------------------------------------------
    // Find products purchased by this customer
    // ---------------------------------------------------------

    const { data: orderItems, error: itemsError } =
      await supabase
        .from("order_items")
        .select("product_id, quantity")
        .in("order_id", orderIds);

    if (itemsError) {
      throw itemsError;
    }

    const purchasedProductIds = new Set<string>();
    const productFrequency = new Map<string, number>();

    for (const item of orderItems || []) {
      if (!item.product_id) continue;

      purchasedProductIds.add(item.product_id);

      productFrequency.set(
        item.product_id,
        (productFrequency.get(item.product_id) || 0) +
          Number(item.quantity || 1),
      );
    }

    // ---------------------------------------------------------
    // Find categories of products the customer bought
    // ---------------------------------------------------------

    const purchasedCategories = new Map<string, number>();

    for (const product of activeProducts) {
      if (!purchasedProductIds.has(product.id)) {
        continue;
      }

      if (!product.category) {
        continue;
      }

      purchasedCategories.set(
        product.category,
        (purchasedCategories.get(product.category) || 0) + 1,
      );
    }

    // ---------------------------------------------------------
    // Score products
    // ---------------------------------------------------------

    const recommendations = activeProducts
      .filter((product: any) => {
        
        let score = 0;

        // Same category as previous purchases
        if (product.category) {
          const categoryFrequency =
            purchasedCategories.get(product.category) || 0;

          score += categoryFrequency * 20;
        }
         // Same category as previous purchases
  if (product.category) {
    const categoryFrequency =
      purchasedCategories.get(product.category) || 0;

    score += categoryFrequency * 10;
  }
        // In stock
        if (product.stock > 0) {
          score += 5;
        }

        // Rating
        if (product.rating > 0) {
          score += Number(product.rating);
        }

        // Discount
        if (
          product.mrp > 0 &&
          product.mrp > product.price
        ) {
          score += 3;
        }

        return {
          ...product,
          recommendation_score: score,
        };
      });

    // Highest score first
    recommendations.sort(
      (a: any, b: any) =>
        b.recommendation_score -
        a.recommendation_score,
    );

    // ---------------------------------------------------------
    // Always return up to 12 products
    // ---------------------------------------------------------

    

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