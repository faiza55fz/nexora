import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const orderId =
      searchParams.get("orderId")?.trim() ?? "";

    const partnerId =
      searchParams.get("partnerId")?.trim() ?? "";

    if (!orderId || !partnerId) {
      return NextResponse.json(
        {
          error:
            "Order or delivery partner information is missing.",
        },
        { status: 400 },
      );
    }

    const { data: tip, error } =
      await supabaseAdmin
        .from("delivery_tips")
        .select(
          "id, order_id, delivery_partner_id, amount, status",
        )
        .eq("order_id", orderId)
        .eq("delivery_partner_id", partnerId)
        .eq("status", "paid")
        .maybeSingle();

    if (error) {
      console.error(
        "Tip lookup failed:",
        error,
      );

      return NextResponse.json(
        {
          error: "Unable to load tip.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      tip: tip ?? null,
    });
  } catch (error) {
    console.error(
      "GET /api/delivery/tip error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to load tip.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderId = String(
      body?.orderId ?? "",
    ).trim();

    const customerId = String(
      body?.customerId ?? "",
    ).trim();

    const amount = Number(body?.amount ?? 0);

    if (!orderId || !customerId) {
      return NextResponse.json(
        {
          error:
            "Order or customer information is missing.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid tip amount.",
        },
        { status: 400 },
      );
    }

    const roundedAmount =
      Math.round(amount * 100) / 100;

    if (roundedAmount > 500) {
      return NextResponse.json(
        {
          error:
            "Maximum tip amount is ₹500.",
        },
        { status: 400 },
      );
    }

    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select(
          `
            id,
            customer_email,
            status,
            delivery_partner_id
          `,
        )
        .eq("id", orderId)
        .maybeSingle();

    if (orderError) {
      console.error(
        "Tip order lookup failed:",
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
        {
          error: "Order not found.",
        },
        { status: 404 },
      );
    }

    if (!order.delivery_partner_id) {
      return NextResponse.json(
        {
          error:
            "A delivery partner has not been assigned yet.",
        },
        { status: 400 },
      );
    }

    if (
      order.status !== "out-for-delivery" &&
      order.status !== "delivered"
    ) {
      return NextResponse.json(
        {
          error:
            "Tips are available when the order is out for delivery or delivered.",
        },
        { status: 400 },
      );
    }

    const { data: customer, error: customerError } =
      await supabaseAdmin
        .from("customers")
        .select("id, email")
        .eq("id", customerId)
        .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        {
          error:
            "Customer account not found.",
        },
        { status: 404 },
      );
    }

    if (
      customer.email &&
      order.customer_email &&
      customer.email.toLowerCase() !==
        order.customer_email.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to tip for this order.",
        },
        { status: 403 },
      );
    }

    const { data: existingTip } =
      await supabaseAdmin
        .from("delivery_tips")
        .select("id")
        .eq("order_id", orderId)
        .eq("customer_id", customerId)
        .eq("status", "paid")
        .limit(1);

    if (
      existingTip &&
      existingTip.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "A tip has already been added for this order.",
        },
        { status: 400 },
      );
    }

    const { data: tip, error: tipError } =
      await supabaseAdmin
        .from("delivery_tips")
        .insert({
          order_id: orderId,
          delivery_partner_id:
            order.delivery_partner_id,
          customer_id: customerId,
          amount: roundedAmount,
          status: "paid",
        })
        .select()
        .single();

    if (tipError) {
      console.error(
        "Tip creation failed:",
        tipError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to add tip.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      tip,
    });
  } catch (error) {
    console.error(
      "POST /api/delivery/tip error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to process tip.",
      },
      { status: 500 },
    );
  }
}