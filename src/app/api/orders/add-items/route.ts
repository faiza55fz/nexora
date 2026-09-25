import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const accessToken = authorization
      .replace("Bearer ", "")
      .trim();

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

    const orderId = body?.orderId;
    const items = body?.items;

    if (
      typeof orderId !== "string" ||
      !orderId.trim()
    ) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "No items were provided." },
        { status: 400 },
      );
    }

    /*
     * Make sure this order actually belongs
     * to the authenticated customer.
     */
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

    if (
      order.status !== "placed" &&
      order.status !== "confirmed"
    ) {
      return NextResponse.json(
        {
          error:
            "Items can only be added before your order is packed.",
        },
        { status: 400 },
      );
    }

    /*
     * Only send the fields the database function needs.
     */
    const cleanedItems = items.map((item) => ({
      variantId: item?.variantId,
      quantity: Number(item?.quantity),
    }));

    if (
      cleanedItems.some(
        (item) =>
          typeof item.variantId !== "string" ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid item details." },
        { status: 400 },
      );
    }

    const { data, error } =
      await supabaseAdmin.rpc(
        "add_items_to_order",
        {
          p_order_id: orderId,
          p_items: cleanedItems,
        },
      );

    if (error) {
      console.error(
        "Adding items to order failed:",
        error,
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to add items to the order.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (error) {
    console.error(
      "POST /api/orders/add-items error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to add items to the order.",
      },
      { status: 500 },
    );
  }
}