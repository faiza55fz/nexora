import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type OrderItemInput = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};

type CreateOrderRequest = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: "cod";
  items: OrderItemInput[];
};

const allowedStatuses = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out-for-delivery",
  "delivered",
  "cancelled",
  "return-requested",
];

function generateOrderNumber() {
  const date = new Date();

  const year = date
    .getFullYear()
    .toString()
    .slice(-2);

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  const random = Math.floor(
    1000 + Math.random() * 9000,
  );

  return `NXR-${year}${month}${day}-${random}`;
}

/*
 * GET ORDERS
 */
export async function GET() {
  try {
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
          latitude,
          longitude,
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
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "Fetching orders failed:",
        error,
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      orders: data ?? [],
    });
  } catch (error) {
    console.error(
      "Get orders API error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to fetch orders.",
      },
      { status: 500 },
    );
  }
}

/*
 * PATCH ORDER STATUS / CANCEL ORDER
 */
export async function PATCH(
  request: Request,
) {
  try {
    const body = await request.json();

    const orderId =
      typeof body.orderId === "string"
        ? body.orderId.trim()
        : "";

    const status =
      typeof body.status === "string"
        ? body.status.trim()
        : "";

    if (!orderId) {
      return NextResponse.json(
        {
          error: "Order ID is required.",
        },
        { status: 400 },
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid order status.",
        },
        { status: 400 },
      );
    }

    /*
     * Customer cancellation
     *
     * Stock must be restored atomically with
     * the order status change.
     */
    if (status === "cancelled") {
      const { data, error } =
        await supabaseAdmin.rpc(
          "cancel_order_with_stock",
          {
            p_order_id: orderId,
          },
        );

      if (error) {
        console.error(
          "Cancelling order failed:",
          error,
        );

        return NextResponse.json(
          {
            error:
              error.message ||
              "Unable to cancel the order.",
          },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        order: data,
      });
    }

    /*
     * Other status updates remain unchanged.
     * These are currently used by admin/order management.
     */
    const { data, error } =
      await supabaseAdmin
        .from("orders")
        .update({
          status,
        })
        .eq("id", orderId)
        .select(
          "id, order_number, status",
        )
        .single();

    if (error || !data) {
      console.error(
        "Updating order status failed:",
        error,
      );

      return NextResponse.json(
        {
          error:
            error?.message ||
            "Unable to update order status.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (error) {
    console.error(
      "Update order status API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Invalid status update request.",
      },
      { status: 400 },
    );
  }
}

/*
 * CREATE ORDER
 */
export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as CreateOrderRequest;

    if (
      !body.customerName ||
      !body.customerEmail ||
      !body.customerPhone ||
      !body.address
    ) {
      return NextResponse.json(
        {
          error:
            "Missing customer or delivery information.",
        },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Your cart is empty.",
        },
        { status: 400 },
      );
    }

    /*
     * Coordinates are optional for now.
     *
     * They will be null for addresses that don't
     * have a saved location yet.
     */
    const latitude =
      typeof body.latitude === "number" &&
      Number.isFinite(body.latitude)
        ? body.latitude
        : null;

    const longitude =
      typeof body.longitude === "number" &&
      Number.isFinite(body.longitude)
        ? body.longitude
        : null;

    const items = body.items.map((item) => ({
      productId: String(item.productId),
      quantity: Number(item.quantity),
    }));

    if (
      items.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0,
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid cart items.",
        },
        { status: 400 },
      );
    }

    const { data, error } =
      await supabaseAdmin.rpc(
        "create_order_with_stock",
        {
          p_customer_name:
            body.customerName.trim(),

          p_customer_email:
            body.customerEmail.trim(),

          p_customer_phone:
            body.customerPhone.trim(),

          p_address:
            body.address.trim(),

          p_payment_method: "cod",

          p_items: items,

          p_latitude: latitude,

          p_longitude: longitude,
        },
      );

    if (error) {
      console.error(
        "Create order error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to place the order. Please try again.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: {
          id: data.id,
          orderNumber: data.orderNumber,
          status: data.status,
          subtotal: data.subtotal,
          deliveryFee: data.deliveryFee,
          total: data.total,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/orders error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to place the order. Please try again.",
      },
      { status: 500 },
    );
  }
}