import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get(
      "customerId",
    );

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          message: "customerId is required.",
        },
        { status: 400 },
      );
    }

   const { data: activityData, error: activityError } =
  await supabaseAdmin
    .from("customer_product_activity")
    .select(
      `
        product_id,
        activity_count,
        last_activity_at
      `,
    )
    .eq("customer_id", customerId)
    .eq("activity_type", "purchase")
    .order("activity_count", {
      ascending: false,
    })
    .limit(6);

    if (activityError) {
      console.error(
        "Family package activity error:",
        activityError,
      );

      return NextResponse.json(
        {
          success: false,
          message: activityError.message,
        },
        { status: 500 },
      );
    }



const productIds = (activityData ?? []).map(
  (item: any) => item.product_id,
);

if (productIds.length === 0) {
  return NextResponse.json({
    success: true,
    products: [],
  });
}

const { data: productData, error: productError } =
  await supabaseAdmin
    .from("products")
    .select(
      `
        id,
        name,
         brand,
        description,
        active,
        subcategory,
        product_variants (
          variant_name,
          selling_price,
          mrp,
          active
        ),
        product_images (
          image_url,
          is_primary
        )
      `,
    )
    .in("id", productIds);


if (productError) {
  console.error(
    "Family package products error:",
    JSON.stringify(productError, null, 2),
  );

  return NextResponse.json(
    {
      success: false,
      message: productError.message,
      details: productError.details,
      hint: productError.hint,
      code: productError.code,
    },
    { status: 500 },
  );
}

const products = (productData ?? []).map(
  (product: any) => {
    const variant =
      product.product_variants?.find(
        (item: any) => item.active !== false,
      ) ||
      product.product_variants?.[0];

    const image =
      product.product_images?.find(
        (item: any) => item.is_primary,
      )?.image_url ||
      product.product_images?.[0]?.image_url;

    return {
      id: product.id,
      name: product.name,
      price: Number(
        variant?.selling_price || 0,
      ),
      image,
      category: product.subcategory || "",
    };
  },
);

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(
      "GET /api/customer/family-package error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 500 },
    );
  }
}