import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

    const orderId =
      typeof body.orderId === "string"
        ? body.orderId.trim()
        : "";

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 },
      );
    }

    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select(
          "id, order_number, customer_email, status",
        )
        .eq("id", orderId)
        .eq("customer_email", user.email)
        .single();

    if (orderError || !order) {
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
            "This order can no longer be cancelled.",
        },
        { status: 400 },
      );
    }

    /*
     * Cancel the order and restore stock.
     */
    const { data, error } =
      await supabaseAdmin.rpc(
        "cancel_order_with_stock",
        {
          p_order_id: orderId,
        },
      );

    if (error) {
      console.error(
        "Customer cancellation failed:",
        error,
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to cancel the order.",
        },
        { status: 400 },
      );
    }

    /*
     * Create customer notification.
     *
     * Notification failure must never undo
     * the successful cancellation.
     */
    try {
      const { data: customer } =
        await supabaseAdmin
          .from("customers")
          .select("id")
          .eq("email", order.customer_email)
          .maybeSingle();

      if (customer?.id) {
        const { error: notificationError } =
          await supabaseAdmin
            .from("notifications")
            .insert({
              recipient_id: customer.id,
              recipient_type: "customer",
              type: "order-cancelled",
              title: "Order cancelled",
              message: `Your order ${order.order_number} has been cancelled.`,
              order_id: order.id,
            });

        if (notificationError) {
          console.error(
            "Cancellation notification failed:",
            notificationError,
          );
        }
      } else {
        console.warn(
          "Customer not found for cancellation notification:",
          order.customer_email,
        );
      }
    } catch (notificationError) {
      console.error(
        "Cancellation notification error:",
        notificationError,
      );
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (error) {
    console.error(
      "POST /api/orders/cancel error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to cancel the order.",
      },
      { status: 500 },
    );
  }
}