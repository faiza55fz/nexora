import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get("partnerId");

    if (!partnerId) {
      return NextResponse.json(
        { error: "Delivery partner ID is required." },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_settlement_preferences")
      .select(
        "id, delivery_partner_id, settlement_type, is_active",
      )
      .eq("delivery_partner_id", partnerId)
      .maybeSingle();

    if (error) {
      console.error(
        "Settlement preference lookup failed:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load settlement preference.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      preference: data,
    });
  } catch (error) {
    console.error(
      "GET /api/delivery/settlement error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load settlement preference.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const partnerId = body.partnerId;
    const settlementType = body.settlementType;

    if (!partnerId) {
      return NextResponse.json(
        {
          error:
            "Delivery partner ID is required.",
        },
        { status: 400 },
      );
    }

    if (
      !["daily", "weekly"].includes(
        settlementType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Settlement type must be daily or weekly.",
        },
        { status: 400 },
      );
    }

    const { data: partner, error: partnerError } =
      await supabaseAdmin
        .from("delivery_partners")
        .select("id")
        .eq("id", partnerId)
        .maybeSingle();

    if (partnerError) {
      console.error(
        "Delivery partner lookup failed:",
        partnerError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify delivery partner.",
        },
        { status: 500 },
      );
    }

    if (!partner) {
      return NextResponse.json(
        {
          error:
            "Delivery partner not found.",
        },
        { status: 404 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_settlement_preferences")
      .upsert(
        {
          delivery_partner_id: partnerId,
          settlement_type: settlementType,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict:
            "delivery_partner_id",
        },
      )
      .select(
        "id, delivery_partner_id, settlement_type, is_active",
      )
      .single();

    if (error) {
      console.error(
        "Settlement preference update failed:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to save settlement preference.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${
        settlementType === "daily"
          ? "Daily"
          : "Weekly"
      } settlement selected.`,
      preference: data,
    });
  } catch (error) {
    console.error(
      "POST /api/delivery/settlement error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to save settlement preference.",
      },
      { status: 500 },
    );
  }
}