import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function isValidAdminSession(token: string | undefined) {
  if (!token) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!secret || !adminEmail) return false;

  const parts = token.split("|");

  if (parts.length !== 3) return false;

  const [email, expiresAtString, signature] = parts;
  const expiresAt = Number(expiresAtString);

  if (!email || !Number.isFinite(expiresAt) || !signature) {
    return false;
  }

  if (Date.now() > expiresAt || email !== adminEmail) {
    return false;
  }

  const payload = `${email}|${expiresAt}`;

  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    const actual = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (actual.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get("nexora-admin-session");

  if (!isValidAdminSession(session?.value)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const code = String(body?.code ?? "")
      .trim()
      .toUpperCase();

    const discountType = String(
      body?.discountType ?? "",
    ).trim();

    const discountValue = Number(
      body?.discountValue ?? 0,
    );

    const minimumOrderValue = Number(
      body?.minimumOrderValue ?? 0,
    );

    const maximumDiscount =
      body?.maximumDiscount === "" ||
      body?.maximumDiscount === null ||
      body?.maximumDiscount === undefined
        ? null
        : Number(body.maximumDiscount);

    const usageLimit =
      body?.usageLimit === "" ||
      body?.usageLimit === null ||
      body?.usageLimit === undefined
        ? null
        : Number(body.usageLimit);

    const expiresAt =
      body?.expiresAt === ""
        ? null
        : body?.expiresAt ?? null;

    const firstOrderOnly =
      Boolean(body?.firstOrderOnly);

    if (!code) {
      return NextResponse.json(
        { error: "Promotion code is required." },
        { status: 400 },
      );
    }

    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      return NextResponse.json(
        {
          error:
            "Code must be 3–30 characters using letters, numbers, hyphens, or underscores.",
        },
        { status: 400 },
      );
    }

    if (
      discountType !== "percentage" &&
      discountType !== "fixed"
    ) {
      return NextResponse.json(
        { error: "Invalid discount type." },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      return NextResponse.json(
        { error: "Discount value must be greater than zero." },
        { status: 400 },
      );
    }

    if (
      discountType === "percentage" &&
      discountValue > 100
    ) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%." },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(minimumOrderValue) ||
      minimumOrderValue < 0
    ) {
      return NextResponse.json(
        { error: "Invalid minimum order value." },
        { status: 400 },
      );
    }

    if (
      maximumDiscount !== null &&
      (!Number.isFinite(maximumDiscount) ||
        maximumDiscount <= 0)
    ) {
      return NextResponse.json(
        { error: "Invalid maximum discount." },
        { status: 400 },
      );
    }

    if (
      usageLimit !== null &&
      (!Number.isInteger(usageLimit) ||
        usageLimit <= 0)
    ) {
      return NextResponse.json(
        { error: "Usage limit must be a positive whole number." },
        { status: 400 },
      );
    }

    if (expiresAt) {
      const expiryDate = new Date(expiresAt);

      if (Number.isNaN(expiryDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid expiry date." },
          { status: 400 },
        );
      }

      if (expiryDate <= new Date()) {
        return NextResponse.json(
          { error: "Expiry date must be in the future." },
          { status: 400 },
        );
      }
    }

    const { data: existingCoupon, error: existingError } =
      await supabaseAdmin
        .from("coupons")
        .select("id")
        .eq("code", code)
        .maybeSingle();

    if (existingError) {
      console.error(
        "Checking promotion code failed:",
        existingError,
      );

      return NextResponse.json(
        { error: "Unable to check promotion code." },
        { status: 500 },
      );
    }

    if (existingCoupon) {
      return NextResponse.json(
        { error: "That promotion code already exists." },
        { status: 409 },
      );
    }

    const { data: coupon, error: insertError } =
      await supabaseAdmin
        .from("coupons")
        .insert({
          code,
          discount_type: discountType,
          discount_value: discountValue,
          minimum_order_value: minimumOrderValue,
          maximum_discount: maximumDiscount,
          expires_at: expiresAt,
          first_order_only: firstOrderOnly,
          usage_limit: usageLimit,
          used_count: 0,
          is_active: true,
        })
        .select(
          "id, code, discount_type, discount_value, minimum_order_value, maximum_discount, expires_at, first_order_only, usage_limit, used_count, is_active",
        )
        .single();

    if (insertError) {
      console.error(
        "Creating promotion failed:",
        insertError,
      );

      return NextResponse.json(
  {
    error: insertError.message,
    details: insertError.details,
    hint: insertError.hint,
    code: insertError.code,
  },
  { status: 500 },
);
    }
console.log("Promotion created:", coupon);
    return NextResponse.json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error(
      "POST /api/admin/promotions error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create promotion.",
      },
      { status: 500 },
    );
  }
}