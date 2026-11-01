
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    // Authenticate customer
    const authHeader = request.headers.get("authorization");

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // Validate request
    const body = await request.json();
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Enter a valid payment amount." },
        { status: 400 }
      );
    }

    // Payment recording is intentionally disabled until
    // a payment gateway or verified confirmation is connected.
    return NextResponse.json(
      {
        success: false,
        paymentPending: true,
        message:
          "Payment processing is not enabled yet. Please try again after payment integration.",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Khata payment API error:", error);

    return NextResponse.json(
      { error: "Unable to process Khata payment." },
      { status: 500 }
    );
  }
}
