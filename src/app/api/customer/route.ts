import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const result = await supabaseAdmin
      .from("customers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (result.error) {
      console.error("Fetching customers failed:", result.error);

      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customerCount: result.count ?? 0,
      customers: result.data ?? [],
    });
  } catch (error) {
    console.error("Customers API error:", error);

    return NextResponse.json(
      { error: "Unable to fetch customers." },
      { status: 500 }
    );
  }
}