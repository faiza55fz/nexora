import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length === 12) {
    return digits.slice(2);
  }

  return digits;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const partnerId = String(body.partnerId ?? "").trim();
    const phone = normalizePhone(String(body.phone ?? ""));

    if (!partnerId || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Partner ID and phone number are required.",
        },
        { status: 400 },
      );
    }

    const { data: partner, error } = await supabase
      .from("delivery_partners")
      .select(
        `
          id,
          name,
          email,
          phone,
          status,
          area,
          vehicle_type,
          vehicle_number,
          kyc_status
        `,
      )
      .eq("id", partnerId)
      .maybeSingle();

    if (error) {
      console.error("Delivery partner lookup error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to verify delivery partner.",
        },
        { status: 500 },
      );
    }

    if (!partner) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery partner not found.",
        },
        { status: 401 },
      );
    }

    if (normalizePhone(partner.phone) !== phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Partner ID and phone number do not match.",
        },
        { status: 401 },
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
    console.error("Delivery partner login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while signing in.",
      },
      { status: 500 },
    );
  }
}