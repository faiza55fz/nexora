
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const campaigns = (data ?? [])
      .filter((campaign) => {
        const starts =
          !campaign.start_date ||
          new Date(campaign.start_date).getTime() <=
            new Date(now).getTime();

        const ends =
          !campaign.end_date ||
          new Date(campaign.end_date).getTime() >=
            new Date(now).getTime();

        return starts && ends;
      })
      .map((campaign) => ({
        ...campaign,
        campaign_products: [...(campaign.campaign_products ?? [])]
         .filter((item) => {
  const product = Array.isArray(item.products)
    ? item.products[0]
    : item.products;

  return product?.active !== false;
})
          .sort(
            (a, b) =>
              (a.display_order ?? 0) -
              (b.display_order ?? 0),
          ),
      }));

    return NextResponse.json({
      success: true,
      campaigns,
    });
  } catch (error) {
    console.error("Festival campaigns error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load festival campaigns.",
      },
      { status: 500 },
    );
  }
}
