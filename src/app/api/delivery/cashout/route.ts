import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const partnerId = body.partnerId;
    const amount = Number(body.amount);
    const paymentMethod = body.paymentMethod ?? "instant";

    if (!partnerId) {
      return NextResponse.json(
        {
          error: "Delivery partner ID is required.",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          error: "Enter a valid cashout amount.",
        },
        { status: 400 },
      );
    }

    if (
      !["instant", "bank", "upi"].includes(
        paymentMethod,
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid payment method.",
        },
        { status: 400 },
      );
    }

    const {
      data: partner,
      error: partnerError,
    } = await supabaseAdmin
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
          error: "Delivery partner not found.",
        },
        { status: 404 },
      );
    }

    const {
      data: payoutAccount,
      error: payoutError,
    } = await supabaseAdmin
      .from("delivery_payout_accounts")
      .select(
        "id, payout_type, is_active",
      )
      .eq("delivery_partner_id", partnerId)
      .eq("is_active", true)
      .maybeSingle();

    if (payoutError) {
      console.error(
        "Payout account lookup failed:",
        payoutError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify payout account.",
        },
        { status: 500 },
      );
    }

    if (!payoutAccount) {
      return NextResponse.json(
        {
          error:
            "Please add a payout account before requesting a cashout.",
        },
        { status: 400 },
      );
    }

    const {
      data: earnings,
      error: earningsError,
    } = await supabaseAdmin
      .from("delivery_earnings")
      .select("amount, status")
      .eq("delivery_partner_id", partnerId)
      .eq("status", "completed");

    if (earningsError) {
      console.error(
        "Delivery earnings lookup failed:",
        earningsError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to calculate available balance.",
        },
        { status: 500 },
      );
    }

    const earnedAmount = (
      earnings ?? []
    ).reduce(
      (sum, item) =>
        sum + Number(item.amount ?? 0),
      0,
    );

    const {
      data: previousCashouts,
      error: cashoutError,
    } = await supabaseAdmin
      .from("delivery_cashouts")
      .select("amount, status")
      .eq("delivery_partner_id", partnerId)
      .in("status", [
        "pending",
        "processing",
        "completed",
      ]);

    if (cashoutError) {
      console.error(
        "Delivery cashout lookup failed:",
        cashoutError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to calculate cashout balance.",
        },
        { status: 500 },
      );
    }

    const alreadyCashout = (
      previousCashouts ?? []
    ).reduce(
      (sum, item) =>
        sum + Number(item.amount ?? 0),
      0,
    );

    const availableBalance =
      Math.round(
        (earnedAmount - alreadyCashout) * 100,
      ) / 100;

    const requestedAmount =
      availableBalance;

    console.log(
      "CASHOUT SERVER DEBUG",
      {
        partnerId,
        clientRequestedAmount: amount,
        earnedAmount,
        alreadyCashout,
        availableBalance,
        cashoutAmount: requestedAmount,
      },
    );

    if (requestedAmount <= 0) {
      return NextResponse.json(
        {
          error:
            "You do not have any available balance to cash out.",
        },
        { status: 400 },
      );
    }

    const {
      data: cashout,
      error: insertError,
    } = await supabaseAdmin
      .from("delivery_cashouts")
      .insert({
        delivery_partner_id: partnerId,
        amount: requestedAmount,
        status: "pending",
        payment_method: paymentMethod,
      })
      .select(
        `
          id,
          delivery_partner_id,
          amount,
          status,
          payment_method,
          reference_id,
          created_at
        `,
      )
      .single();

    if (insertError) {
      console.error(
        "Delivery cashout creation failed:",
        insertError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to create cashout request.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Cashout request created successfully.",
      cashout,
      availableBalance:
        Math.round(
          (availableBalance -
            requestedAmount) *
            100,
        ) / 100,
    });
  } catch (error) {
    console.error(
      "POST /api/delivery/cashout error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to process cashout request.",
      },
      { status: 500 },
    );
  }
}