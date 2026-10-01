import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const allowedActivityTypes = [
  "search",
  "view",
  "cart",
  "wishlist",
  "purchase",
] as const;

type ActivityType = (typeof allowedActivityTypes)[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customerId,
      productId,
      activityType,
    }: {
      customerId?: string;
      productId?: string;
      activityType?: ActivityType;
    } = body;

    if (!customerId || !productId || !activityType) {
      return NextResponse.json(
        {
          success: false,
          message:
            "customerId, productId and activityType are required.",
        },
        { status: 400 },
      );
    }

    if (!allowedActivityTypes.includes(activityType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid activity type.",
        },
        { status: 400 },
      );
    }

    const { data: customer, error: customerError } =
      await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("id", customerId)
        .maybeSingle();

    if (customerError) {
      console.error(
        "Customer lookup error:",
        customerError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to verify customer.",
        },
        { status: 500 },
      );
    }

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        { status: 404 },
      );
    }

    const { data: product, error: productError } =
      await supabaseAdmin
        .from("products")
        .select("id")
        .eq("id", productId)
        .maybeSingle();

    if (productError) {
      console.error(
        "Product lookup error:",
        productError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to verify product.",
        },
        { status: 500 },
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 },
      );
    }

    const { data: existingActivity, error: existingError } =
      await supabaseAdmin
        .from("customer_product_activity")
        .select("id, activity_count")
        .eq("customer_id", customerId)
        .eq("product_id", productId)
        .eq("activity_type", activityType)
        .maybeSingle();

    if (existingError) {
      console.error(
        "Activity lookup error:",
        existingError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to record activity.",
        },
        { status: 500 },
      );
    }

    if (existingActivity) {
      const { error: updateError } =
        await supabaseAdmin
          .from("customer_product_activity")
          .update({
            activity_count:
              Number(existingActivity.activity_count ?? 0) + 1,
            last_activity_at: new Date().toISOString(),
          })
          .eq("id", existingActivity.id);

      if (updateError) {
        console.error(
          "Activity update error:",
          updateError,
        );

        return NextResponse.json(
          {
            success: false,
            message: "Unable to update activity.",
          },
          { status: 500 },
        );
      }
    } else {
      const { error: insertError } =
        await supabaseAdmin
          .from("customer_product_activity")
          .insert({
            customer_id: customerId,
            product_id: productId,
            activity_type: activityType,
            activity_count: 1,
          });

      if (insertError) {
        console.error(
          "Activity insert error:",
          insertError,
        );

        return NextResponse.json(
          {
            success: false,
            message: "Unable to save activity.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Customer activity recorded.",
    });
  } catch (error) {
    console.error(
      "POST /api/customer/activity error:",
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