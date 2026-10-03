import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const allowedIssueTypes = [
  "missing_item",
  "damaged_item",
  "incorrect_item",
  "other",
] as const;

const allowedRequestTypes = [
  "issue",
  "refund",
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

    const requestType = String(
      body.requestType ?? "issue",
    ).trim();

    if (!orderId || !orderItemId) {
      return NextResponse.json(
        {
          error:
            "Order and product are required.",
        },
        { status: 400 },
      );
    }

    if (
      !allowedRequestTypes.includes(
        requestType as (typeof allowedRequestTypes)[number],
      )
    ) {
      return NextResponse.json(
        { error: "Invalid request type." },
        { status: 400 },
      );
    }

    if (requestType === "issue" && !issueType) {
      return NextResponse.json(
        {
          error:
            "Issue type is required.",
        },
        { status: 400 },
      );
    }

    if (
      requestType === "issue" &&
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
        .select(
          "id, customer_email, status",
        )
        .eq("id", orderId)
        .eq("customer_email", user.email)
        .maybeSingle();

    if (orderError) {
      console.error(
        "Checking order ownership failed:",
        orderError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify the order.",
        },
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
        {
          error:
            "Requests can only be submitted after an order is delivered.",
        },
        { status: 400 },
      );
    }

    const {
      data: orderItem,
      error: orderItemError,
    } = await supabaseAdmin
      .from("order_items")
      .select(
        "id, order_id",
      )
      .eq("id", orderItemId)
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderItemError) {
      console.error(
        "Checking order item failed:",
        orderItemError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify the product.",
        },
        { status: 500 },
      );
    }

    if (!orderItem) {
      return NextResponse.json(
        {
          error:
            "Product not found in this order.",
        },
        { status: 404 },
      );
    }

    const finalIssueType =
      requestType === "refund"
        ? "other"
        : issueType;

    const finalDescription =
      requestType === "refund"
        ? `REFUND REQUEST: ${
            description || "Customer requested a refund."
          }`
        : description;

    const { data: issue, error: insertError } =
      await supabaseAdmin
        .from("order_issues")
        .insert({
          order_id: orderId,
          order_item_id: orderItemId,
          customer_id: user.id,
          issue_type: finalIssueType,
          description: finalDescription || null,
        })
        .select(
          "id, order_id, order_item_id, issue_type, description, status, created_at",
        )
        .single();

    if (insertError) {
      console.error(
        "Creating order request failed:",
        insertError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to submit the request.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      requestType,
      issue,
    });
  } catch (error) {
    console.error(
      "POST /api/orders/issues error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to submit the request.",
      },
      { status: 500 },
    );
  }
}
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const issueId =
      typeof body.issueId === "string"
        ? body.issueId.trim()
        : "";

    const status =
      typeof body.status === "string"
        ? body.status.trim()
        : "";

    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
      "refunded",
    ];

    if (!issueId) {
      return NextResponse.json(
        {
          error: "Request ID is required.",
        },
        { status: 400 },
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid refund request status.",
        },
        { status: 400 },
      );
    }

    const { data: issue, error: issueError } =
      await supabaseAdmin
        .from("order_issues")
        .select(
          "id, issue_type, description, status",
        )
        .eq("id", issueId)
        .maybeSingle();

    if (issueError) {
      console.error(
        "Checking refund request failed:",
        issueError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify the refund request.",
        },
        { status: 500 },
      );
    }

    if (!issue) {
      return NextResponse.json(
        {
          error: "Refund request not found.",
        },
        { status: 404 },
      );
    }

    if (
      issue.issue_type !== "other" ||
      !String(issue.description ?? "")
        .toUpperCase()
        .startsWith("REFUND REQUEST:")
    ) {
      return NextResponse.json(
        {
          error: "This is not a refund request.",
        },
        { status: 400 },
      );
    }

    const { data: updatedIssue, error: updateError } =
      await supabaseAdmin
        .from("order_issues")
        .update({
          status,
        })
        .eq("id", issueId)
        .select(
          "id, order_id, order_item_id, issue_type, description, status, created_at",
        )
        .single();

    if (updateError) {
      console.error(
        "Updating refund request failed:",
        updateError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to update the refund request.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      issue: updatedIssue,
    });
  } catch (error) {
    console.error(
      "PATCH /api/orders/issues error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to update the refund request.",
      },
      { status: 500 },
    );
  }
}