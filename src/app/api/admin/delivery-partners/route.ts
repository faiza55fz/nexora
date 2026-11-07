
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const validStatuses = [
  "available",
  "assigned",
  "on-delivery",
  "offline",
];

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("delivery_partners")
      .select(`
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
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      partners: data ?? [],
    });
  } catch (error) {
    console.error("Fetch delivery partners error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch delivery partners" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const area = String(body.area ?? "").trim();
    const status = body.status ?? "available";

    if (!name || !phone || !area) {
      return NextResponse.json(
        { success: false, message: "Name, phone and area are required" },
        { status: 400 },
      );
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid delivery status" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_partners")
      .insert({
        name,
        phone,
        area,
        status,
        email: body.email ?? null,
        kyc_status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      partner: data,
    });
  } catch (error) {
    console.error("Add delivery partner error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to add delivery partner" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id ?? "");
    const status = body.status;

    if (!id || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Valid partner ID and status are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_partners")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      partner: data,
    });
  } catch (error) {
    console.error("Update delivery partner error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update delivery partner" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Partner ID is required" },
        { status: 400 },
      );
    }

    // Do not delete a partner who is referenced by an order.
    const { data: linkedOrders, error: checkError } =
      await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("delivery_partner_id", id)
        .limit(1);

    if (checkError) throw checkError;

    if (linkedOrders && linkedOrders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This delivery member is linked to an order. Set their status to offline instead.",
        },
        { status: 409 },
      );
    }

    const { error } = await supabaseAdmin
      .from("delivery_partners")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete delivery partner error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to remove delivery partner" },
      { status: 500 },
    );
  }
}
