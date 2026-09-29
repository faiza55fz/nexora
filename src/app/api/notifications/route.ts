import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const recipientId = searchParams.get("recipientId");
    const recipientType = searchParams.get("recipientType");

    if (!recipientId || !recipientType) {
      return NextResponse.json(
        {
          success: false,
          message: "recipientId and recipientType are required.",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(`
        id,
        recipient_id,
        recipient_type,
        type,
        title,
        message,
        order_id,
        is_read,
        created_at
      `)
      .eq("recipient_id", recipientId)
      .eq("recipient_type", recipientType)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Notifications fetch error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to load notifications.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      notifications: data ?? [],
    });
  } catch (error) {
    console.error("Notifications GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while loading notifications.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const recipientId = String(body.recipientId ?? "").trim();
    const recipientType = String(body.recipientType ?? "").trim();
    const type = String(body.type ?? "").trim();
    const title = String(body.title ?? "").trim();
    const message = String(body.message ?? "").trim();
    const orderId = body.orderId
      ? String(body.orderId).trim()
      : null;

    if (
      !recipientId ||
      !recipientType ||
      !type ||
      !title ||
      !message
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "recipientId, recipientType, type, title and message are required.",
        },
        { status: 400 },
      );
    }

    if (
      !["customer", "delivery_partner", "admin"].includes(
        recipientType,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid recipient type.",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        recipient_id: recipientId,
        recipient_type: recipientType,
        type,
        title,
        message,
        order_id: orderId,
      })
      .select(`
        id,
        recipient_id,
        recipient_type,
        type,
        title,
        message,
        order_id,
        is_read,
        created_at
      `)
      .single();

    if (error) {
      console.error("Notification creation error:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to create notification.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      notification: data,
    });
  } catch (error) {
    console.error("Notifications POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating notification.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const notificationId = String(
      body.notificationId ?? "",
    ).trim();

    const markAll = Boolean(body.markAll);
    const recipientId = String(body.recipientId ?? "").trim();

    if (!notificationId && !markAll) {
      return NextResponse.json(
        {
          success: false,
          message: "notificationId or markAll is required.",
        },
        { status: 400 },
      );
    }

    if (markAll) {
      if (!recipientId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "recipientId is required when marking all notifications as read.",
          },
          { status: 400 },
        );
      }

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", recipientId)
        .eq("is_read", false);

      if (error) {
        console.error(
          "Mark all notifications read error:",
          error,
        );

        return NextResponse.json(
          {
            success: false,
            message: "Unable to mark notifications as read.",
          },
          { status: 500 },
        );
      }
    } else {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) {
        console.error(
          "Mark notification read error:",
          error,
        );

        return NextResponse.json(
          {
            success: false,
            message: "Unable to mark notification as read.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Notifications PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating notifications.",
      },
      { status: 500 },
    );
  }
}