import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const productId =
      typeof body.productId === "string"
        ? body.productId.trim()
        : "";

    if (!productId) {
      return NextResponse.json(
        {
          error: "Product ID is required.",
        },
        { status: 400 },
      );
    }

    /*
     * Find the currently logged-in customer from the
     * browser's Supabase session.
     */
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Please log in to use Notify Me.",
        },
        { status: 401 },
      );
    }

    const accessToken = authHeader.replace(
      "Bearer ",
      "",
    );

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(accessToken);

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          error: "Please log in to use Notify Me.",
        },
        { status: 401 },
      );
    }

const customerEmail =
  authData.user.email;

const customerId =
  authData.user.id;

/*
 * Find the customer record.
 *
 * The Auth user ID normally matches the
 * customer ID. We also fall back to email
 * because older customer accounts may have
 * been created before that relationship existed.
 */
let customer = null;

if (customerId) {
  const { data: customerById } =
    await supabaseAdmin
      .from("customers")
      .select("id, email")
      .eq("id", customerId)
      .maybeSingle();

  customer = customerById;
}

if (!customer && customerEmail) {
  const { data: customerByEmail } =
    await supabaseAdmin
      .from("customers")
      .select("id, email")
      .eq("email", customerEmail)
      .maybeSingle();

  customer = customerByEmail;
}


 if (!customer?.id) {
  return NextResponse.json(
    {
      error: `Customer account not found. Auth ID: ${authData.user.id}. Auth email: ${authData.user.email ?? "none"}`,
    },
    { status: 404 },
  );
}
    /*
     * Make sure the product exists.
     */
    const { data: product, error: productError } =
      await supabaseAdmin
        .from("products")
        .select("id, name")
        .eq("id", productId)
        .maybeSingle();

    if (productError) {
      console.error(
        "Finding product failed:",
        productError,
      );

      return NextResponse.json(
        {
          error: "Unable to find this product.",
        },
        { status: 500 },
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        { status: 404 },
      );
    }

    /*
 * Check whether this customer already has
 * an active Notify Me request for this product.
 */
const { data: existingRequest } =
  await supabaseAdmin
    .from("back_in_stock_requests")
    .select("id")
    .eq("customer_id", customer.id)
    .eq("product_id", product.id)
    .is("notified_at", null)
    .maybeSingle();

if (existingRequest) {
  return NextResponse.json({
    success: true,
    alreadyRequested: true,
  });
}

/*
 * Save the back-in-stock request.
 */
const { error: insertError } =
  await supabaseAdmin
    .from("back_in_stock_requests")
    .insert({
      customer_id: customer.id,
      product_id: product.id,
    });

if (insertError) {
  console.error(
    "Saving Notify Me request failed:",
    insertError,
  );

  return NextResponse.json(
    {
      error:
        "Unable to save your notification request.",
    },
    { status: 500 },
  );
}

    if (insertError) {
      console.error(
        "Saving Notify Me request failed:",
        insertError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to save your notification request.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      alreadyRequested: false,
    });
  } catch (error) {
    console.error(
      "Back-in-stock notification error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to save your notification request.",
      },
      { status: 500 },
    );
  }
}