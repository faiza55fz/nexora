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
 * PATCH ORDER STATUS
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

    if (
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          error: "Invalid order status.",
        },
        { status: 400 },
      );
    }

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
export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as CreateOrderRequest;

    if (
      !body.customerName?.trim() ||
      !body.customerEmail?.trim() ||
      !body.customerPhone?.trim() ||
      !body.address?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Customer and delivery details are required.",
        },
        { status: 400 },
      );
    }

    if (!body.items?.length) {
      return NextResponse.json(
        {
          error: "Your cart is empty.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(body.subtotal) ||
      !Number.isFinite(body.deliveryFee) ||
      !Number.isFinite(body.total)
    ) {
      return NextResponse.json(
        {
          error: "Invalid order amount.",
        },
        { status: 400 },
      );
    }

    const orderNumber =
      generateOrderNumber();

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number:
          orderNumber,
        customer_name:
          body.customerName.trim(),
        customer_email:
          body.customerEmail.trim(),
        customer_phone:
          body.customerPhone.trim(),
        address:
          body.address.trim(),
        subtotal:
          body.subtotal,
        delivery_fee:
          body.deliveryFee,
        total:
          body.total,
        payment_method: "cod",
        status: "placed",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error(
        "Order creation failed:",
        orderError,
      );

      return NextResponse.json(
        {
          error:
            orderError?.message ||
            "Unable to create order.",
          details: orderError,
        },
        { status: 500 },
      );
    }

    const items =
      body.items.map((item) => ({
        order_id: order.id,
        product_id:
          item.productId,
        product_name:
          item.productName,
        quantity:
          item.quantity,
        price: item.price,
      }));

    const {
      error: itemsError,
    } = await supabaseAdmin
      .from("order_items")
      .insert(items);

    if (itemsError) {
      console.error(
        "Order items creation failed:",
        itemsError,
      );

      await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", order.id);

      return NextResponse.json(
        {
          error:
            "Unable to save order items.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          orderNumber:
            order.order_number,
          status: order.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Create order API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Invalid order request.",
      },
      { status: 400 },
    );
  }
}