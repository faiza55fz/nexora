import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const allowedIssueTypes = [
  "missing_item",
  "damaged_item",
  "incorrect_item",
  "other",
] as const;

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

    if (authError || !user?.id || !user.email) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const orderId = String(body.orderId ?? "").trim();
    const orderItemId = String(
      body.orderItemId ?? "",
    ).trim();
    const issueType = String(
      body.issueType ?? "",
    ).trim();
    const description = String(
      body.description ?? "",
    ).trim();

    if (!orderId || !orderItemId || !issueType) {
      return NextResponse.json(
        {
          error:
            "Order, product, and issue type are required.",
        },
        { status: 400 },
      );
    }

    if (
      !allowedIssueTypes.includes(
        issueType as (typeof allowedIssueTypes)[number],
      )
    ) {
      return NextResponse.json(
        { error: "Invalid issue type." },
        { status: 400 },
      );
    }

    if (description.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Description must be 1000 characters or less.",
        },
        { status: 400 },
      );
    }

    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select("id, customer_email, status")
        .eq("id", orderId)
        .eq("customer_email", user.email)
        .maybeSingle();

    if (orderError) {
      console.error(
        "Checking order ownership failed:",
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
   if (order.status !== "delivered") {
  return NextResponse.json(
    { error: "Issues can only be reported after an order is delivered." },
    { status: 400 },
  );
}



    const {
      data: orderItem,
      error: orderItemError,
    } = await supabaseAdmin
      .from("order_items")
      .select("id, order_id")
      .eq("id", orderItemId)
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderItemError) {
      console.error(
        "Checking order item failed:",
        orderItemError,
      );

      return NextResponse.json(
        { error: "Unable to verify the product." },
        { status: 500 },
      );
    }

    if (!orderItem) {
      return NextResponse.json(
        { error: "Product not found in this order." },
        { status: 404 },
      );
    }

    const { data: issue, error: insertError } =
      await supabaseAdmin
        .from("order_issues")
        .insert({
          order_id: orderId,
          order_item_id: orderItemId,
          customer_id: user.id,
          issue_type: issueType,
          description: description || null,
        })
        .select(
          "id, order_id, order_item_id, issue_type, description, status, created_at",
        )
        .single();

    if (insertError) {
      console.error(
        "Creating order issue failed:",
        insertError,
      );

      return NextResponse.json(
        { error: "Unable to submit the issue." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      issue,
    });
  } catch (error) {
    console.error(
      "POST /api/orders/issues error:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to submit the issue." },
      { status: 500 },
    );
  }
}