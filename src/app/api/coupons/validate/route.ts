import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const code = String(body?.code ?? "")
      .trim()
      .toUpperCase();

    const customerId = String(
      body?.customerId ?? "",
    ).trim();

    const subtotal = Number(body?.subtotal ?? 0);

    if (!code) {
      return NextResponse.json(
        { error: "Please enter a coupon code." },
        { status: 400 },
      );
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer account not found." },
        { status: 401 },
      );
    }

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json(
        { error: "Invalid order amount." },
        { status: 400 },
      );
    }

    const { data: coupon, error: couponError } =
      await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

    if (couponError) {
      console.error(
        "Coupon lookup failed:",
        couponError,
      );

      return NextResponse.json(
        { error: "Unable to validate coupon." },
        { status: 500 },
      );
    }

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid or inactive coupon." },
        { status: 400 },
      );
    }

    if (
      coupon.expires_at &&
      new Date(coupon.expires_at) <= new Date()
    ) {
      return NextResponse.json(
        { error: "This coupon has expired." },
        { status: 400 },
      );
    }

    if (
      coupon.usage_limit !== null &&
      coupon.used_count >= coupon.usage_limit
    ) {
      return NextResponse.json(
        { error: "This coupon is no longer available." },
        { status: 400 },
      );
    }

    if (
      subtotal < Number(coupon.minimum_order_value ?? 0)
    ) {
      return NextResponse.json(
        {
          error: `Minimum order value is ₹${Number(
            coupon.minimum_order_value ?? 0,
          ).toLocaleString("en-IN")}.`,
        },
        { status: 400 },
      );
    }

    if (coupon.first_order_only) {
      const { data: customer } = await supabaseAdmin
        .from("customers")
        .select("id, email")
        .eq("id", customerId)
        .maybeSingle();

      if (!customer) {
        return NextResponse.json(
          { error: "Customer account not found." },
          { status: 404 },
        );
      }

      const { count, error: orderError } =
        await supabaseAdmin
          .from("orders")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("customer_email", customer.email);

      if (orderError) {
        console.error(
          "First-order check failed:",
          orderError,
        );

        return NextResponse.json(
          { error: "Unable to verify first-order eligibility." },
          { status: 500 },
        );
      }

      if ((count ?? 0) > 0) {
        return NextResponse.json(
          {
            error:
              "This coupon is available only on your first order.",
          },
          { status: 400 },
        );
      }
    }

    let discount = 0;

    if (coupon.discount_type === "percentage") {
      discount =
        (subtotal * Number(coupon.discount_value)) /
        100;
    } else {
      discount = Number(coupon.discount_value);
    }

    if (coupon.maximum_discount !== null) {
      discount = Math.min(
        discount,
        Number(coupon.maximum_discount),
      );
    }

    discount = Math.min(discount, subtotal);

    discount = Math.round(discount * 100) / 100;

    return NextResponse.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discount,
      discountType: coupon.discount_type,
      discountValue: Number(coupon.discount_value),
      message: `Coupon applied. You saved ₹${discount.toLocaleString(
        "en-IN",
      )}.`,
    });
  } catch (error) {
    console.error(
      "Coupon validation error:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to validate coupon." },
      { status: 500 },
    );
  }
}