
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isValidAdminSession } from "@/lib/admin-auth";

const allowedStatuses = ["draft", "published", "paused"];

function isAuthorized(request: NextRequest) {
  const session = request.cookies.get("nexora-admin-session");
  return isValidAdminSession(session?.value);
}

// GET: Load all festival campaigns
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("festival_campaigns")
      .select(`
        *,
        campaign_products (
          id,
          product_id,
          festive_discount,
          display_order,
          products (
            id,
            name,
            brand,
            product_images (
              image_url,
              display_order,
              is_primary
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      campaigns: data ?? [],
    });
  } catch (error) {
    console.error("GET festival campaigns error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load festival campaigns.",
      },
      { status: 500 },
    );
  }
}

// POST: Create a festival campaign
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const festivalName = String(body.festivalName ?? "").trim();
    const campaignName = String(body.campaignName ?? "").trim();
    const heading = String(body.heading ?? "").trim();
    const subtitle = String(body.subtitle ?? "").trim();
    const theme = String(body.theme ?? "default").trim();
    const backgroundColor = String(
      body.backgroundColor ?? "",
    ).trim();
    const buttonText = String(
      body.buttonText ?? "Shop Now",
    ).trim();

    const status = String(body.status ?? "draft").trim();

    const startDate = body.startDate || null;
    const endDate = body.endDate || null;

    const selectedProducts = body.products;

    if (!festivalName || !campaignName) {
      return NextResponse.json(
        {
          success: false,
          message: "Festival name and campaign name are required.",
        },
        { status: 400 },
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid campaign status.",
        },
        { status: 400 },
      );
    }

   if (!Array.isArray(selectedProducts)) {
  return NextResponse.json(
    {
      success: false,
      message: "Invalid campaign products.",
    },
    { status: 400 },
  );
}

if (status !== "draft" && selectedProducts.length === 0) {
  return NextResponse.json(
    {
      success: false,
      message: "Select at least one product before publishing.",
    },
    { status: 400 },
  );
}

    if (selectedProducts.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: "A campaign can contain at most 50 products.",
        },
        { status: 400 },
      );
    }

    if (
      startDate &&
      Number.isNaN(new Date(startDate).getTime())
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid start date." },
        { status: 400 },
      );
    }

    if (
      endDate &&
      Number.isNaN(new Date(endDate).getTime())
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid end date." },
        { status: 400 },
      );
    }

    if (
      startDate &&
      endDate &&
      new Date(endDate) <= new Date(startDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "End date must be after the start date.",
        },
        { status: 400 },
      );
    }

    const productRows = selectedProducts.map(
      (item: any, index: number) => ({
        product_id: String(item.productId ?? "").trim(),
        festive_discount: Number(item.festiveDiscount ?? 0),
        display_order: Number(item.displayOrder ?? index),
      }),
    );

    const productIds = productRows.map(
      (item) => item.product_id,
    );

    if (
      productRows.some(
        (item) =>
          !item.product_id ||
          !Number.isFinite(item.festive_discount) ||
          item.festive_discount < 0 ||
          item.festive_discount > 90 ||
          !Number.isInteger(item.display_order),
      ) ||
      new Set(productIds).size !== productIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or duplicate campaign product details.",
        },
        { status: 400 },
      );
    }

    const { data: campaign, error: campaignError } =
      await supabaseAdmin
        .from("festival_campaigns")
        .insert({
          festival_name: festivalName,
          campaign_name: campaignName,
          heading: heading || null,
          subtitle: subtitle || null,
          theme,
          background_color: backgroundColor || null,
          button_text: buttonText,
          status,
          start_date: startDate,
          end_date: endDate,
        })
        .select()
        .single();

    if (campaignError) throw campaignError;

    const rows = productRows.map((item) => ({
      campaign_id: campaign.id,
      product_id: item.product_id,
      festive_discount: item.festive_discount,
      display_order: item.display_order,
    }));

   if (rows.length > 0) {
  const { error: productsError } = await supabaseAdmin
    .from("campaign_products")
    .insert(rows);

  if (productsError) {
    await supabaseAdmin
      .from("festival_campaigns")
      .delete()
      .eq("id", campaign.id);

    throw productsError;
  }
} 

    return NextResponse.json(
      {
        success: true,
        message: "Festival campaign created successfully.",
        campaign,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST festival campaign error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create festival campaign.",
      },
      { status: 500 },
    );
  }
}

// PATCH: Update campaign details or status
export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Campaign ID is required." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.festivalName !== undefined) {
      updates.festival_name = String(body.festivalName).trim();
    }

    if (body.campaignName !== undefined) {
      updates.campaign_name = String(body.campaignName).trim();
    }

    if (body.heading !== undefined) {
      updates.heading = String(body.heading).trim() || null;
    }

    if (body.subtitle !== undefined) {
      updates.subtitle = String(body.subtitle).trim() || null;
    }

    if (body.theme !== undefined) {
      updates.theme = String(body.theme).trim();
    }

    if (body.backgroundColor !== undefined) {
      updates.background_color =
        String(body.backgroundColor).trim() || null;
    }

    if (body.buttonText !== undefined) {
      updates.button_text = String(body.buttonText).trim();
    }

    if (body.status !== undefined) {
      const status = String(body.status).trim();

      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid campaign status." },
          { status: 400 },
        );
      }

      updates.status = status;
    }

    if (body.startDate !== undefined) {
      updates.start_date = body.startDate || null;
    }

    if (body.endDate !== undefined) {
      updates.end_date = body.endDate || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No campaign changes supplied." },
        { status: 400 },
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: campaign, error } = await supabaseAdmin
      .from("festival_campaigns")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: "Campaign not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Festival campaign updated successfully.",
      campaign,
    });
  } catch (error) {
    console.error("PATCH festival campaign error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update festival campaign.",
      },
      { status: 500 },
    );
  }
}
