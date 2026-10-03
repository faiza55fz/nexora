import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const partnerId = searchParams.get("partnerId");

    if (!partnerId) {
      return NextResponse.json(
        {
          error:
            "Delivery partner ID is required.",
        },
        { status: 400 },
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("delivery_earnings")
      .select(`
        id,
        order_id,
        amount,
        base_amount,
        incentive_amount,
        tip_amount,
        block_date,
        block_start_time,
        block_end_time,
        status,
        settlement_type,
        settled_at,
        created_at
      `)
      .eq(
        "delivery_partner_id",
        partnerId,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Delivery earnings lookup failed:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load delivery earnings.",
        },
        { status: 500 },
      );
    }

    const earnings = data ?? [];

    const today = new Date();

    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff =
      day === 0 ? 6 : day - 1;

    startOfWeek.setDate(
      startOfWeek.getDate() - diff,
    );

    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );

    const getAmount = (
      item: (typeof earnings)[number],
    ) =>
      Number(item.amount ?? 0);

    const todayEarnings = earnings
      .filter(
        (item) =>
          new Date(item.created_at) >=
          startOfToday,
      )
      .reduce(
        (sum, item) =>
          sum + getAmount(item),
        0,
      );

    const weeklyEarnings = earnings
      .filter(
        (item) =>
          new Date(item.created_at) >=
          startOfWeek,
      )
      .reduce(
        (sum, item) =>
          sum + getAmount(item),
        0,
      );

    const monthlyEarnings = earnings
      .filter(
        (item) =>
          new Date(item.created_at) >=
          startOfMonth,
      )
      .reduce(
        (sum, item) =>
          sum + getAmount(item),
        0,
      );

    /*
     * Calculate total completed earnings.
     */
    const totalEarned = earnings
      .filter(
        (item) =>
          item.status === "completed",
      )
      .reduce(
        (sum, item) =>
          sum + getAmount(item),
        0,
      );

    /*
     * Get all cashouts that have already
     * consumed available earnings.
     */
    const {
      data: cashouts,
      error: cashoutError,
    } = await supabaseAdmin
      .from("delivery_cashouts")
      .select(
        "amount, status",
      )
      .eq(
        "delivery_partner_id",
        partnerId,
      )
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
            "Unable to calculate available balance.",
        },
        { status: 500 },
      );
    }

    const alreadyCashout = (
      cashouts ?? []
    ).reduce(
      (sum, item) =>
        sum + Number(item.amount ?? 0),
      0,
    );

    /*
     * This is the amount the partner can
     * actually cash out right now.
     */
    const availableBalance =
      Math.max(
        0,
        Math.round(
          (totalEarned -
            alreadyCashout) *
            100,
        ) / 100,
      );

    const weeklyCompletedDeliveries =
      earnings.filter(
        (item) =>
          item.status === "completed" &&
          new Date(item.created_at) >=
            startOfWeek,
      ).length;

    const weeklyBonusTarget = 10;
    const weeklyBonusReward = 100;

    const weeklyBonusEarned =
      weeklyCompletedDeliveries >=
      weeklyBonusTarget
        ? weeklyBonusReward
        : 0;

    const weeklyBonusProgress =
      Math.min(
        weeklyCompletedDeliveries,
        weeklyBonusTarget,
      );

    return NextResponse.json({
      earnings,

      summary: {
        today: todayEarnings,
        weekly: weeklyEarnings,
        monthly: monthlyEarnings,

        totalEarned,

        alreadyCashout,

        availableBalance,
      },

      bonuses: {
        weeklyDelivery: {
          completedDeliveries:
            weeklyCompletedDeliveries,

          target:
            weeklyBonusTarget,

          reward:
            weeklyBonusReward,

          earned:
            weeklyBonusEarned,

          progress:
            weeklyBonusProgress,
        },
      },
    });
  } catch (error) {
    console.error(
      "GET /api/delivery/earnings error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load delivery earnings.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const partnerId = body.partnerId;
    const orderId = body.orderId ?? null;

    const amount = Number(body.amount ?? 0);
    const baseAmount = Number(
      body.baseAmount ?? amount,
    );
    const incentiveAmount = Number(
      body.incentiveAmount ?? 0,
    );
    const tipAmount = Number(
      body.tipAmount ?? 0,
    );

    if (!partnerId) {
      return NextResponse.json(
        {
          error:
            "Delivery partner ID is required.",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          error: "Invalid earning amount.",
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
          error: "Delivery partner not found.",
        },
        { status: 404 },
      );
    }

    // Prevent the same order from creating
    // multiple earnings records.
    if (orderId) {
  const { data: existingEarnings, error: existingError } =
    await supabaseAdmin
      .from("delivery_earnings")
      .select("id, amount, status")
      .eq(
        "delivery_partner_id",
        partnerId,
      )
      .eq("order_id", orderId)
      .limit(1);

  if (existingError) {
    console.error(
      "Existing earning lookup failed:",
      existingError,
    );

    return NextResponse.json(
      {
        error:
          "Unable to verify existing earning.",
      },
      { status: 500 },
    );
  }

  const existingEarning =
    existingEarnings?.[0];

  if (existingEarning) {
    return NextResponse.json({
      success: true,
      alreadyExists: true,
      earning: existingEarning,
    });
  }
}

    const { data: earning, error: insertError } =
      await supabaseAdmin
        .from("delivery_earnings")
        .insert({
          delivery_partner_id: partnerId,
          order_id: orderId,
          amount,
          base_amount: baseAmount,
          incentive_amount: incentiveAmount,
          tip_amount: tipAmount,
          block_date: new Date()
            .toISOString()
            .slice(0, 10),
          status: "completed",
        })
        .select(`
          id,
          order_id,
          amount,
          base_amount,
          incentive_amount,
          tip_amount,
          block_date,
          block_start_time,
          block_end_time,
          status,
          settlement_type,
          settled_at,
          created_at
        `)
        .single();

    if (insertError) {
      console.error(
        "Delivery earning creation failed:",
        insertError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to create delivery earning.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      alreadyExists: false,
      earning,
    });
  } catch (error) {
    console.error(
      "POST /api/delivery/earnings error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to create delivery earning.",
      },
      { status: 500 },
    );
  }
}