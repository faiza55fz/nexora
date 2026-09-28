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

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select(`
        id,
        product_id,
        customer_name,
        rating,
        title,
        body,
        verified,
        helpful,
        not_helpful,
        media,
        created_at
      `)
      .eq("product_id", productId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Failed to load reviews:", error);

      return NextResponse.json(
        { error: "Failed to load reviews." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      reviews: data ?? [],
    });
  } catch (error) {
    console.error("GET reviews error:", error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const accessToken =
      authorization.replace("Bearer ", "").trim();

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const {
      orderId,
      productId,
      rating,
      title,
      review,
    } = body;

    if (!orderId || !productId) {
      return NextResponse.json(
        { error: "Order and product are required." },
        { status: 400 },
      );
    }

    if (
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5." },
        { status: 400 },
      );
    }

    if (
      typeof review !== "string" ||
      !review.trim()
    ) {
      return NextResponse.json(
        { error: "Review text is required." },
        { status: 400 },
      );
    }

    // Make sure this order belongs to the logged-in customer
    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select(`
          id,
          customer_email,
          customer_name,
          status,
          order_items (
            product_id,
            product_name
          )
        `)
        .eq("id", orderId)
        .eq("customer_email", user.email)
        .maybeSingle();

    if (orderError) {
      console.error(
        "Checking review order failed:",
        orderError,
      );

      return NextResponse.json(
        { error: "Unable to verify the order." },
        { status: 500 },
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 },
      );
    }

    // Reviews are allowed only after delivery
    if (order.status !== "delivered") {
      return NextResponse.json(
        {
          error:
            "You can review this product only after the order is delivered.",
        },
        { status: 403 },
      );
    }

    // Make sure the product was actually purchased in this order
    const purchasedItem = order.order_items?.find(
      (item) => item.product_id === productId,
    );

    if (!purchasedItem) {
      return NextResponse.json(
        {
          error:
            "This product was not part of the selected order.",
        },
        { status: 403 },
      );
    }

    // Prevent the same customer from reviewing the same
    // product from the same order more than once
    const { data: existingReview } =
      await supabaseAdmin
        .from("reviews")
        .select("id")
        .eq("order_id", orderId)
        .eq("product_id", productId)
        .eq("customer_email", user.email)
        .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        {
          error:
            "You have already reviewed this product from this order.",
        },
        { status: 409 },
      );
    }

    const { data: savedReview, error: reviewError } =
      await supabaseAdmin
        .from("reviews")
        .insert({
          order_id: orderId,
          product_id: productId,
          customer_email: user.email,
          customer_name:
            order.customer_name || user.email,
          rating,
          title:
            typeof title === "string" &&
            title.trim()
              ? title.trim()
              : null,
          body: review.trim(),
          verified: true,
          helpful: 0,
          not_helpful: 0,
          media: [],
        })
        .select()
        .single();

    if (reviewError) {
      console.error(
        "Saving review failed:",
        reviewError,
      );

      return NextResponse.json(
        { error: reviewError.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        review: savedReview,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/reviews error:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to submit review." },
      { status: 500 },
    );
  }
}