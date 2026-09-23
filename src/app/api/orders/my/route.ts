import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const accessToken =
      authorization.replace("Bearer ", "").trim();

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("orders")
        .select(`
          id,
          order_number,
          customer_name,
          customer_email,
          customer_phone,
          address,
          subtotal,
          delivery_fee,
          total,
          payment_method,
          status,
          created_at,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            price
          )
        `)
        .eq("customer_email", user.email)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "Fetching customer orders failed:",
        error,
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      orders: data ?? [],
    });
  } catch (error) {
    console.error(
      "GET /api/orders/my error:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to fetch your orders." },
      { status: 500 },
    );
  }
}