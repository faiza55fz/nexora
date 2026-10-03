import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: "Invalid authentication." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const orderId = String(body.orderId ?? "").trim();
    const customerName = String(body.customerName ?? "").trim();
    const customerPhone = String(body.customerPhone ?? "").trim();
    const address = String(body.address ?? "").trim();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 },
      );
    }

    if (!customerName) {
      return NextResponse.json(
        { error: "Customer name is required." },
        { status: 400 },
      );
    }

    if (!customerPhone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 },
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: "Delivery address is required." },
        { status: 400 },
      );
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, status, customer_email, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error("Loading order for edit failed:", orderError);

      return NextResponse.json(
        { error: "Unable to load the order." },
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
      String(order.customer_email).toLowerCase() !==
      String(user.email).toLowerCase()
    ) {
      return NextResponse.json(
        { error: "You are not allowed to edit this order." },
        { status: 403 },
      );
    }

    if (
      order.status !== "placed" &&
      order.status !== "confirmed"
    ) {
      return NextResponse.json(
        {
          error:
            "Order details can only be edited before the order is packed.",
        },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        customer_name: customerName,
        customer_phone: customerPhone,
        address,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Updating order details failed:", updateError);

      return NextResponse.json(
        { error: "Unable to update order details." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order details updated successfully.",
    });
  } catch (error) {
    console.error("Order edit API failed:", error);

    return NextResponse.json(
      { error: "Unable to update order details." },
      { status: 500 },
    );
  }
}