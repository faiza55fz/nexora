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

  if (Date.now() > expiresAt) {
    return false;
  }

  if (email !== adminEmail) {
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
    const { data: customers, error: customersError } =
      await supabaseAdmin
        .from("customers")
        .select("id, name, email, phone");

    if (customersError) {
      console.error(
        "Fetching customers failed:",
        customersError,
      );

      return NextResponse.json(
        { error: customersError.message },
        { status: 500 },
      );
    }

    const customerIds = (customers ?? []).map(
      (customer) => customer.id,
    );

    let activities: {
      customer_id: string;
      last_activity_at: string | null;
    }[] = [];

    if (customerIds.length > 0) {
      const { data: activityData, error: activityError } =
        await supabaseAdmin
          .from("customer_product_activity")
          .select(
            "customer_id, last_activity_at",
          )
          .in("customer_id", customerIds);

      if (activityError) {
        console.error(
          "Fetching customer activity failed:",
          activityError,
        );

        return NextResponse.json(
          { error: activityError.message },
          { status: 500 },
        );
      }

      activities = activityData ?? [];
    }

    const latestActivity = new Map<
      string,
      string | null
    >();

    for (const activity of activities) {
      const current =
        latestActivity.get(activity.customer_id);

      if (
        activity.last_activity_at &&
        (!current ||
          new Date(activity.last_activity_at).getTime() >
            new Date(current).getTime())
      ) {
        latestActivity.set(
          activity.customer_id,
          activity.last_activity_at,
        );
      }
    }

    const activeSince =
      Date.now() - 30 * 24 * 60 * 60 * 1000;

    const result = (customers ?? []).map(
      (customer) => {
        const lastActivity =
          latestActivity.get(customer.id) ?? null;

        const isActive =
          !!lastActivity &&
          new Date(lastActivity).getTime() >=
            activeSince;

        return {
          id: customer.id,
          name: customer.name || "Customer",
          email: customer.email || "",
          phone: customer.phone || "",
          lastActivityAt: lastActivity,
          status: isActive ? "active" : "inactive",
        };
      },
    );

    return NextResponse.json({
      success: true,
      customers: result,
      total: result.length,
      active: result.filter(
        (customer) => customer.status === "active",
      ).length,
    });
  } catch (error) {
    console.error(
      "Admin customers API error:",
      error,
    );

    return NextResponse.json(
      { error: "Unable to fetch customers." },
      { status: 500 },
    );
  }
}