
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("festival_campaigns")
      .select(`
        id,
        festival_name,
        campaign_name,
        heading,
        subtitle,
        theme,
        background_color,
        button_text,
        status,
        start_date,
        end_date,
        campaign_products (
          id,
          product_id,
          festive_discount,
          display_order,
          products (
            id,
            name,
            brand,
            category_id,
            subcategory,
            description,
            active,
            rating,
            review_count,
            categories (id, name),
            product_variants (
              id,
              variant_name,
              mrp,
              selling_price,
              gst_rate,
              active,
              inventory (
                stock_quantity,
                reserved_quantity
              )
            ),
            product_images (
              id,
              image_url,
              display_order,
              is_primary
            )
          )
        )
      `)
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Festival campaign not found." },
        { status: 404 },
      );
    }

    const starts =
      !data.start_date ||
      new Date(data.start_date).getTime() <= new Date(now).getTime();

    const ends =
      !data.end_date ||
      new Date(data.end_date).getTime() >= new Date(now).getTime();

    if (!starts || !ends) {
      return NextResponse.json(
        { success: false, message: "Festival campaign is not active." },
        { status: 404 },
      );
    }

    const campaign = {
      ...data,
      campaign_products: [...(data.campaign_products ?? [])]
        .filter((item) => {
          const product = Array.isArray(item.products)
            ? item.products[0]
            : item.products;

          return product?.active !== false;
        })
        .sort(
          (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
        ),
    };

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("Festival campaign detail error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load festival campaign.",
      },
      { status: 500 },
    );
  }
}
