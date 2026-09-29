import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
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
          kyc_status,
          created_at,
          updated_at
        `,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Admin delivery partners lookup error:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      partners: data ?? [],
    });
  } catch (error) {
    console.error(
      "Admin delivery partners API error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load delivery partners.",
      },
      { status: 500 },
    );
  }
}