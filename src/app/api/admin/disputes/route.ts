import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

function isValidAdminSession(token: string | undefined) {
  if (!token) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!secret || !adminEmail) return false;

  const parts = token.split("|");

  if (parts.length !== 3) return false;

  const [email, expiresAtString, signature] = parts;
  const expiresAt = Number(expiresAtString);

  if (!email || !Number.isFinite(expiresAt) || !signature) {
    return false;
  }

  if (Date.now() > expiresAt || email !== adminEmail) {
    return false;
  }

  const payload = `${email}|${expiresAt}`;

  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    const actual = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (actual.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get("nexora-admin-session");

  if (!isValidAdminSession(session?.value)) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const { data: issues, error: issuesError } =
      await supabaseAdmin
        .from("order_issues")
        .select(
          "id, order_id, order_item_id, customer_id, issue_type, description, status, created_at",
        )
        .order("created_at", {
          ascending: false,
        });

    if (issuesError) {
      console.error(
        "Fetching order issues failed:",
        issuesError,
      );

      return NextResponse.json(
        { error: issuesError.message },
        { status: 500 },
      );
    }

    const orderIds = [
      ...new Set(
        (issues ?? []).map((issue) => issue.order_id),
      ),
    ];

    const customerIds = [
      ...new Set(
        (issues ?? [])
          .map((issue) => issue.customer_id)
          .filter(Boolean),
      ),
    ];

    const itemIds = [
      ...new Set(
        (issues ?? []).map(
          (issue) => issue.order_item_id,
        ),
      ),
    ];

    const [ordersResult, customersResult, itemsResult] =
      await Promise.all([
        orderIds.length
          ? supabaseAdmin
              .from("orders")
              .select(
                "id, order_number, customer_name, customer_email, customer_phone, status",
              )
              .in("id", orderIds)
          : Promise.resolve({ data: [], error: null }),

        customerIds.length
          ? supabaseAdmin
              .from("customers")
              .select("id, name, email, phone")
              .in("id", customerIds)
          : Promise.resolve({ data: [], error: null }),

        itemIds.length
          ? supabaseAdmin
              .from("order_items")
              .select(
                "id, product_id, product_name, quantity, price",
              )
              .in("id", itemIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (ordersResult.error) {
      throw new Error(ordersResult.error.message);
    }

    if (customersResult.error) {
      throw new Error(customersResult.error.message);
    }

    if (itemsResult.error) {
      throw new Error(itemsResult.error.message);
    }

    const orders = new Map(
      (ordersResult.data ?? []).map((order) => [
        order.id,
        order,
      ]),
    );

    const customers = new Map(
      (customersResult.data ?? []).map((customer) => [
        customer.id,
        customer,
      ]),
    );

    const items = new Map(
      (itemsResult.data ?? []).map((item) => [
        item.id,
        item,
      ]),
    );

    const result = (issues ?? []).map((issue) => ({
      ...issue,
      order: orders.get(issue.order_id) ?? null,
      customer:
        customers.get(issue.customer_id) ?? null,
      item:
        items.get(issue.order_item_id) ?? null,
    }));

    return NextResponse.json({
      success: true,
      issues: result,
      total: result.length,
    });
  } catch (error) {
    console.error(
      "Admin disputes API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to fetch complaints.",
      },
      { status: 500 },
    );
  }
}