import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makeSku(name: string, unit?: string) {
  const namePart =
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 20) || "PRODUCT";

  const unitPart =
    (unit || "1UNIT")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 10) || "1UNIT";

  return `${namePart}-${unitPart}`;
}

async function getProducts() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(`
      id,
      category_id,
      name,
      brand,
      subcategory,
      description,
      active,
      rating,
      review_count,
      created_at,
      updated_at,
moderation_status,
      categories (
        id,
        name
      ),
      product_variants (
        id,
        sku,
        variant_name,
        mrp,
        selling_price,
        gst_rate,
        unit,
        quantity_value,
        active,
        inventory (
          id,
          variant_id,
          stock_quantity,
          reserved_quantity,
          low_stock_threshold
        )
      ),
      product_images (
        id,
        image_url,
        display_order,
        is_primary
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get("admin") === "true";

    const products = await getProducts();

    const visibleProducts = adminView
      ? products
      : products.filter(
          (product: any) =>
            product.active !== false &&
            product.moderation_status === "approved",
        );

   return NextResponse.json({
  success: true,
  products: visibleProducts,
});
  } catch (error) {
    console.error("GET /api/products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load products.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      id,
      name,
      brand,
      category,
      description,
      price,
      mrp,
      gstRate,
      stock,
      unit,
      image,
      active = true,
      moderation_status,
    } = body;
    

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Product name is required." },
        { status: 400 },
      );
    }

    if (!brand?.trim()) {
      return NextResponse.json(
        { success: false, message: "Brand is required." },
        { status: 400 },
      );
    }

    if (!price || Number(price) <= 0) {
      return NextResponse.json(
        { success: false, message: "Selling price must be greater than 0." },
        { status: 400 },
      );
    }

    if (!mrp || Number(mrp) <= 0) {
      return NextResponse.json(
        { success: false, message: "MRP must be greater than 0." },
        { status: 400 },
      );
    }

    /*
     * Find the category by name.
     * The current Admin UI uses category names such as
     * "fruits", "vegetables", "dairy", etc.
     */
    const categoryName = String(category || "").trim();

    let categoryId: string | null = null;

    if (categoryName) {
      const categoryDisplayName =
        categoryName === "fruits"
          ? "Fruits"
          : categoryName === "vegetables"
            ? "Vegetables"
            : categoryName === "dairy"
              ? "Dairy"
              : categoryName;

      const { data: categoryRow, error: categoryError } =
        await supabaseAdmin
          .from("categories")
          .select("id")
          .ilike("name", categoryDisplayName)
          .limit(1)
          .maybeSingle();

      if (categoryError) {
        throw new Error(categoryError.message);
      }

      categoryId = categoryRow?.id ?? null;
    }

    const productId =
      id?.trim() || `p${Date.now()}`;

    const { data: product, error: productError } =
      await supabaseAdmin
        .from("products")
        .insert({
  id: productId,
  category_id: categoryId,
  name: name.trim(),
  brand: brand.trim(),
  description: description?.trim() || null,
  active: Boolean(active),
  moderation_status: "pending",
})
        .select()
        .single();

    if (productError) {
      throw new Error(productError.message);
    }

    const cleanUnit = unit?.trim() || "1 unit";

    const sku = makeSku(name, cleanUnit);

    const { data: variant, error: variantError } =
      await supabaseAdmin
        .from("product_variants")
        .insert({
          product_id: product.id,
          sku,
          variant_name: cleanUnit,
          mrp: Number(mrp),
          selling_price: Number(price),
          gst_rate: Number(gstRate || 0),
          unit: cleanUnit,
          quantity_value: 1,
          active: Boolean(active),
        })
        .select()
        .single();

    if (variantError) {
      await supabaseAdmin
        .from("products")
        .delete()
        .eq("id", product.id);

      throw new Error(variantError.message);
    }

    const { error: inventoryError } =
      await supabaseAdmin
        .from("inventory")
        .insert({
          variant_id: variant.id,
          stock_quantity: Number(stock || 0),
          reserved_quantity: 0,
          low_stock_threshold: 5,
        });

    if (inventoryError) {
      await supabaseAdmin
        .from("products")
        .delete()
        .eq("id", product.id);

      throw new Error(inventoryError.message);
    }

    if (image?.trim()) {
      const { error: imageError } =
        await supabaseAdmin
          .from("product_images")
          .insert({
            product_id: product.id,
            image_url: image.trim(),
            display_order: 0,
            is_primary: true,
          });

      if (imageError) {
        await supabaseAdmin
          .from("products")
          .delete()
          .eq("id", product.id);

        throw new Error(imageError.message);
      }
    }

    const products = await getProducts();

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully.",
        products,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/products error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create product.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const {
      id,
      name,
      brand,
      category,
      description,
      price,
      mrp,
      gstRate,
      stock,
      unit,
      active,
      moderation_status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required." },
        { status: 400 },
      );
    }

    const { data: existingProduct, error: existingError } =
      await supabaseAdmin
        .from("products")
        .select("id, category_id")
        .eq("id", id)
        .single();

    if (existingError || !existingProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 },
      );
    }

    let categoryId = existingProduct.category_id;

    if (category !== undefined) {
      const categoryName = String(category || "").trim();

      if (categoryName) {
        const categoryDisplayName =
          categoryName === "fruits"
            ? "Fruits"
            : categoryName === "vegetables"
              ? "Vegetables"
              : categoryName === "dairy"
                ? "Dairy"
                : categoryName;

        const { data: categoryRow, error: categoryError } =
          await supabaseAdmin
            .from("categories")
            .select("id")
            .ilike("name", categoryDisplayName)
            .limit(1)
            .maybeSingle();

        if (categoryError) {
          throw new Error(categoryError.message);
        }

        categoryId = categoryRow?.id ?? null;
      } else {
        categoryId = null;
      }
    }

    const { error: productError } =
      await supabaseAdmin
        .from("products")
        .update({
          category_id: categoryId,
          name: name?.trim(),
          brand: brand?.trim(),
          description: description?.trim() || null,
          active:
            active === undefined
              ? undefined
              : Boolean(active),
          updated_at: new Date().toISOString(),
          ...(moderation_status !== undefined && {
    moderation_status,
  }),
        })
        .eq("id", id);

    if (productError) {
      throw new Error(productError.message);
    }

    const { data: variant, error: variantFetchError } =
      await supabaseAdmin
        .from("product_variants")
        .select("id")
        .eq("product_id", id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (variantFetchError) {
      throw new Error(variantFetchError.message);
    }

    if (variant) {
      const variantUpdate: Record<string, unknown> = {};

      if (price !== undefined) {
        variantUpdate.selling_price = Number(price);
      }

      if (mrp !== undefined) {
        variantUpdate.mrp = Number(mrp);
      }

      if (gstRate !== undefined) {
        variantUpdate.gst_rate = Number(gstRate);
      }

      if (unit !== undefined) {
        variantUpdate.unit =
          String(unit || "").trim() || "1 unit";
        variantUpdate.variant_name =
          String(unit || "").trim() || "1 unit";
      }

      if (active !== undefined) {
        variantUpdate.active = Boolean(active);
      }

      variantUpdate.updated_at =
        new Date().toISOString();

      if (Object.keys(variantUpdate).length > 0) {
        const { error: variantError } =
          await supabaseAdmin
            .from("product_variants")
            .update(variantUpdate)
            .eq("id", variant.id);

        if (variantError) {
          throw new Error(variantError.message);
        }
      }

     if (stock !== undefined) {
  const newStock = Number(stock);

  /*
   * Read the current inventory before updating it.
   * We need this to detect a transition from
   * out of stock (0) to available (> 0).
   */
  const { data: currentInventory, error: currentInventoryError, } =
    await supabaseAdmin
      .from("inventory")
      .select("stock_quantity")
      .eq("variant_id", variant.id)
      .maybeSingle();

  if (currentInventoryError) {
    throw new Error(currentInventoryError.message);
  }

  const previousStock =
    Number(currentInventory?.stock_quantity ?? 0);

  const { error: inventoryError } =
    await supabaseAdmin
      .from("inventory")
      .update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("variant_id", variant.id);

  if (inventoryError) {
    throw new Error(inventoryError.message);
  }

  /*
   * If the product was out of stock and is now
   * available, notify customers who requested
   * a back-in-stock notification.
   */
  if (previousStock <= 0 && newStock > 0) {
    const { data: requests, error: requestsError, } =
      await supabaseAdmin
        .from("back_in_stock_requests")
        .select("id, customer_id")
        .eq("product_id", id)
        .is("notified_at", null);

    if (requestsError) {
      console.error(
        "Finding back-in-stock requests failed:",
        requestsError,
      );
    } else if (requests?.length) {
      const notifications = requests.map((request) => ({
        recipient_id: request.customer_id,
        recipient_type: "customer",
        type: "back-in-stock",
        title: "Product is back in stock",
        message: `${name || "A product you requested"} is back in stock. You can order it now.`,
        order_id: null,
      }),);

      const { error: notificationError, } =
        await supabaseAdmin
          .from("notifications")
          .insert(notifications);

      if (notificationError) {
        console.error(
          "Creating back-in-stock notifications failed:",
          notificationError,
        );
      } else {
        const requestIds = requests.map(
          (request) => request.id,
        );

        const { error: markNotifiedError } =
          await supabaseAdmin
            .from("back_in_stock_requests")
            .update({
              notified_at: new Date().toISOString(),
            })
            .in("id", requestIds);

        if (markNotifiedError) {
          console.error(
            "Marking back-in-stock requests as notified failed:",
            markNotifiedError,
          );
        }
      }
    }
  }
}
    }

    const products = await getProducts();

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      products,
    });
  } catch (error) {
    console.error("PATCH /api/products error:", error);

    return NextResponse.json(
  {
    success: false,
    message:
      error instanceof Error
        ? error.message
        : String(error),
  },
  { status: 500 },
);
  }
}