import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select(
        `
          id,
          code,
          discount_type,
          discount_value,
          minimum_order_value,
          maximum_discount,
          expires_at,
          first_order_only
        `,
      )
      .eq("is_active", true)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Coupons fetch failed:",
        error,
      );

      return NextResponse.json(
        {
          error: "Unable to load coupons.",
        },
        { status: 500 },
      );
    }

    const now = new Date();

    const coupons = (data ?? []).filter(
      (coupon) =>
        !coupon.expires_at ||
        new Date(coupon.expires_at) > now,
    );

    return NextResponse.json({
      coupons,
    });
  } catch (error) {
    console.error(
      "GET /api/coupons error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to load coupons.",
      },
      { status: 500 },
    );
  }
}