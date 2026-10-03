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
      .from("delivery_payout_accounts")
      .select(
        `
        id,
        payout_type,
        account_holder_name,
        account_number,
        ifsc_code,
        upi_id,
        is_verified,
        is_active,
        created_at,
        updated_at
      `,
      )
      .eq("delivery_partner_id", partnerId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error(
        "Payout account lookup failed:",
        error,
      );

      return NextResponse.json(
        { error: "Unable to load payout account." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      payoutAccount: data ?? null,
    });
  } catch (error) {
    console.error(
      "Payout account GET failed:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to load payout account." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      partnerId,
      payoutType,
      accountHolderName,
      accountNumber,
      ifscCode,
      upiId,
    } = body;

    if (!partnerId) {
      return NextResponse.json(
        { error: "Delivery partner ID is required." },
        { status: 400 },
      );
    }

    if (!["bank", "upi"].includes(payoutType)) {
      return NextResponse.json(
        { error: "Invalid payout type." },
        { status: 400 },
      );
    }

    const { data: partner, error: partnerError } =
      await supabaseAdmin
        .from("delivery_partners")
        .select("id")
        .eq("id", partnerId)
        .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: "Delivery partner not found." },
        { status: 404 },
      );
    }

    if (payoutType === "bank") {
      if (
        !accountHolderName?.trim() ||
        !accountNumber?.trim() ||
        !ifscCode?.trim()
      ) {
        return NextResponse.json(
          {
            error:
              "Account holder name, account number and IFSC code are required.",
          },
          { status: 400 },
        );
      }
    }

    if (payoutType === "upi") {
      if (!upiId?.trim()) {
        return NextResponse.json(
          { error: "UPI ID is required." },
          { status: 400 },
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_payout_accounts")
      .upsert(
        {
          delivery_partner_id: partnerId,
          payout_type: payoutType,
          account_holder_name:
            payoutType === "bank"
              ? accountHolderName.trim()
              : null,
          account_number:
            payoutType === "bank"
              ? accountNumber.trim()
              : null,
          ifsc_code:
            payoutType === "bank"
              ? ifscCode.trim().toUpperCase()
              : null,
          upi_id:
            payoutType === "upi"
              ? upiId.trim().toLowerCase()
              : null,
          is_verified: false,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "delivery_partner_id",
        },
      )
      .select(
        `
        id,
        payout_type,
        account_holder_name,
        account_number,
        ifsc_code,
        upi_id,
        is_verified,
        is_active,
        created_at,
        updated_at
      `,
      )
      .single();

    if (error) {
      console.error(
        "Payout account save failed:",
        error,
      );

      return NextResponse.json(
        { error: "Unable to save payout account." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      payoutAccount: data,
      message: "Payout account saved successfully.",
    });
  } catch (error) {
    console.error(
      "Payout account POST failed:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to save payout account." },
      { status: 500 },
    );
  }
}