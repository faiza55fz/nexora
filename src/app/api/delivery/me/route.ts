import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function phoneVariants(value: string) {
  const digits = normalizePhone(value);

  if (digits.startsWith("91") && digits.length === 12) {
    return [digits.slice(2), digits, `+${digits}`];
  }

  if (digits.length === 10) {
    return [digits, `91${digits}`, `+91${digits}`];
  }

  return [value.trim()];
}

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication is required.",
        },
        { status: 401 },
      );
    }

    const token = authorization.slice("Bearer ".length).trim();

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Your delivery partner session is invalid or expired.",
        },
        { status: 401 },
      );
    }

    const user = userData.user;
    const partnerId = user.user_metadata?.delivery_partner_id;

    let query = supabase
      .from("delivery_partners")
      .select(
        "id, name, email, phone, status, area, vehicle_type, vehicle_number, kyc_status",
      );

    const { data: partner, error: partnerError } = partnerId
      ? await query.eq("id", partnerId).maybeSingle()
      : await query
          .in("phone", phoneVariants(user.phone ?? ""))
          .maybeSingle();

    if (partnerError) {
      console.error("Delivery partner session lookup error:", partnerError);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to load your delivery partner profile.",
        },
        { status: 500 },
      );
    }

    if (!partner) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery partner account not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        status: partner.status,
        area: partner.area,
        vehicleType: partner.vehicle_type,
        vehicleNumber: partner.vehicle_number,
        kycStatus: partner.kyc_status,
      },
    });
  } catch (error) {
    console.error("Delivery partner session error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while loading your account.",
      },
      { status: 500 },
    );
  }
}
