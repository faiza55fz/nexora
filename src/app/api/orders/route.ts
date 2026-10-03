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
  couponCode?: string | null;
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

const customerNotificationMessages: Record<
  string,
  {
    title: string;
    message: (orderNumber: string) => string;
  }
> = {
  confirmed: {
    title: "Order confirmed",
    message: (orderNumber) =>
      `Your order ${orderNumber} has been confirmed and is being prepared.`,
  },

  packed: {
    title: "Order packed",
    message: (orderNumber) =>
      `Your order ${orderNumber} has been packed and is ready for delivery.`,
  },

  shipped: {
    title: "Order shipped",
    message: (orderNumber) =>
      `Your order ${orderNumber} has been shipped.`,
  },

  "out-for-delivery": {
    title: "Out for delivery",
    message: (orderNumber) =>
      `Your order ${orderNumber} is out for delivery.`,
  },

  delivered: {
    title: "Order delivered",
    message: (orderNumber) =>
      `Your order ${orderNumber} has been delivered successfully.`,
  },

  cancelled: {
    title: "Order cancelled",
    message: (orderNumber) =>
      `Your order ${orderNumber} has been cancelled.`,
  },

  "return-requested": {
    title: "Return requested",
    message: (orderNumber) =>
      `Your return request for order ${orderNumber} has been received.`,
  },
};

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
          delivery_partner_id,
          delivery_partner:delivery_partners (
            name,
            phone
          ),
          address,
          latitude,
          longitude,
          subtotal,
          delivery_fee,
          total,
          payment_method,
          status,
          refund_status,
          refund_amount,
          return_reason,
          exchange_status,
          exchange_reason,
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

    const deliveryPartnerId =
      body.deliveryPartnerId ?? null;

    const refundStatus =
      typeof body.refundStatus === "string"
        ? body.refundStatus.trim()
        : undefined;

    const refundAmount =
      typeof body.refundAmount === "number"
        ? body.refundAmount
        : undefined;

    const returnReason =
      typeof body.returnReason === "string"
        ? body.returnReason.trim()
        : undefined;

    const exchangeStatus =
      typeof body.exchangeStatus === "string"
        ? body.exchangeStatus.trim()
        : undefined;

    const exchangeReason =
      typeof body.exchangeReason === "string"
        ? body.exchangeReason.trim()
        : undefined;

    const customerName =
      typeof body.customerName === "string"
        ? body.customerName.trim()
        : undefined;

    const customerPhone =
      typeof body.customerPhone === "string"
        ? body.customerPhone.trim()
        : undefined;

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : undefined;

    if (!orderId) {
      return NextResponse.json(
        {
          error: "Order ID is required.",
        },
        { status: 400 },
      );
    }

    const allowedRefundStatuses = [
      "not_requested",
      "requested",
      "approved",
      "rejected",
      "refunded",
    ];

    const allowedExchangeStatuses = [
      "not_requested",
      "requested",
      "approved",
      "rejected",
      "completed",
    ];

    if (
      !allowedStatuses.includes(status) &&
      !(
        (refundStatus &&
          allowedRefundStatuses.includes(
            refundStatus,
          )) ||
        (exchangeStatus &&
          allowedExchangeStatuses.includes(
            exchangeStatus,
          ))
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid order status or refund status.",
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

      /*
       * Customer cancellation notification.
       *
       * The cancellation RPC has already completed
       * successfully, so notification failure must
       * never undo the cancellation.
       */
      try {
        const { data: cancelledOrder } =
          await supabaseAdmin
            .from("orders")
            .select(
              "id, order_number, customer_email",
            )
            .eq("id", orderId)
            .maybeSingle();

        if (
          cancelledOrder?.customer_email
        ) {
          const { data: customer } =
            await supabaseAdmin
              .from("customers")
              .select("id")
              .eq(
                "email",
                cancelledOrder.customer_email,
              )
              .maybeSingle();

          if (customer?.id) {
            const {
              error: notificationError,
            } = await supabaseAdmin
              .from("notifications")
              .insert({
                recipient_id: customer.id,
                recipient_type: "customer",
                type: "order-cancelled",
                title: "Order cancelled",
                message: `Your order ${cancelledOrder.order_number} has been cancelled.`,
                order_id: cancelledOrder.id,
              });

            if (notificationError) {
              console.error(
                "Cancellation notification failed:",
                notificationError,
              );
            }
          }
        }
      } catch (notificationError) {
        console.error(
          "Cancellation notification error:",
          notificationError,
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

          ...(deliveryPartnerId
            ? {
                delivery_partner_id:
                  deliveryPartnerId,
              }
            : {}),

          ...(customerName !== undefined && {
            customer_name: customerName,
          }),

          ...(customerPhone !== undefined && {
            customer_phone: customerPhone,
          }),

          ...(address !== undefined && {
            address,
          }),

          ...(refundStatus !== undefined && {
            refund_status: refundStatus,
          }),

          ...(refundAmount !== undefined && {
            refund_amount: refundAmount,
          }),

          ...(returnReason !== undefined && {
            return_reason: returnReason,
          }),

          ...(exchangeStatus !== undefined && {
            exchange_status: exchangeStatus,
          }),

          ...(exchangeReason !== undefined && {
            exchange_reason: exchangeReason,
          }),
        })
        .eq("id", orderId)
        .select(
          "id, order_number, status, customer_email, customer_name, customer_phone, address, refund_status, refund_amount, return_reason, exchange_status, exchange_reason, delivery_partner_id",
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

    /*
     * Customer notification for order status changes.
     *
     * Notification failures must never prevent the
     * order status update from succeeding.
     */
    const notificationConfig =
      customerNotificationMessages[status];

    if (
      notificationConfig &&
      data.customer_email
    ) {
      try {
        const { data: customer } =
          await supabaseAdmin
            .from("customers")
            .select("id")
            .eq(
              "email",
              data.customer_email,
            )
            .maybeSingle();

        if (customer?.id) {
          const {
            error: notificationError,
          } = await supabaseAdmin
            .from("notifications")
            .insert({
              recipient_id: customer.id,
              recipient_type: "customer",
              type: `order-${status}`,
              title:
                notificationConfig.title,
              message:
                notificationConfig.message(
                  data.order_number,
                ),
              order_id: data.id,
            });

          if (notificationError) {
            console.error(
              "Order status notification failed:",
              notificationError,
            );
          }
        }
      } catch (notificationError) {
        console.error(
          "Order status notification error:",
          notificationError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (error) {
    console.error(
      "PATCH /api/orders error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to update the order.",
      },
      { status: 500 },
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

          p_coupon_code:
            body.couponCode?.trim() || null,
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

    /*
     * Customer notification: order placed
     *
     * Notification failure must NOT cause the order
     * itself to fail.
     */
    try {
      const { data: customer } =
        await supabaseAdmin
          .from("customers")
          .select("id")
          .eq(
            "email",
            body.customerEmail.trim(),
          )
          .maybeSingle();

      if (customer?.id) {
        const {
          error: notificationError,
        } = await supabaseAdmin
          .from("notifications")
          .insert({
            recipient_id: customer.id,
            recipient_type: "customer",
            type: "order-placed",
            title: "Order placed successfully",
            message: `Your order ${data.orderNumber} has been placed successfully.`,
            order_id: data.id,
          });

        if (notificationError) {
          console.error(
            "Order notification creation failed:",
            notificationError,
          );
        }
      } else {
        console.warn(
          "Customer not found for order notification:",
          body.customerEmail,
        );
      }
    } catch (notificationError) {
      console.error(
        "Order notification error:",
        notificationError,
      );
    }

    /*
     * Record purchased products for personalization.
     *
     * This belongs in POST because `items` is available
     * here after the order has been created.
     */
    try {
      const { data: customer } =
        await supabaseAdmin
          .from("customers")
          .select("id")
          .eq(
            "email",
            body.customerEmail.trim(),
          )
          .maybeSingle();

      if (customer?.id) {
        for (const item of items) {
          const {
            data: existingActivity,
          } = await supabaseAdmin
            .from("customer_product_activity")
            .select(
              "id, activity_count",
            )
            .eq(
              "customer_id",
              customer.id,
            )
            .eq(
              "product_id",
              item.productId,
            )
            .eq(
              "activity_type",
              "purchase",
            )
            .maybeSingle();

          if (existingActivity) {
            const {
              error: updateError,
            } = await supabaseAdmin
              .from(
                "customer_product_activity",
              )
              .update({
                activity_count:
                  Number(
                    existingActivity.activity_count ??
                      0,
                  ) + item.quantity,
                last_activity_at:
                  new Date().toISOString(),
              })
              .eq(
                "id",
                existingActivity.id,
              );

            if (updateError) {
              console.error(
                "Purchase activity update failed:",
                updateError,
              );
            }
          } else {
            const {
              error: insertError,
            } = await supabaseAdmin
              .from(
                "customer_product_activity",
              )
              .insert({
                customer_id:
                  customer.id,
                product_id:
                  item.productId,
                activity_type:
                  "purchase",
                activity_count:
                  item.quantity,
              });

            if (insertError) {
              console.error(
                "Purchase activity insert failed:",
                insertError,
              );
            }
          }
        }
      }
    } catch (activityError) {
      console.error(
        "Purchase activity tracking failed:",
        activityError,
      );
    }

    /*
     * Record products purchased together.
     *
     * Example:
     * Tomatoes + Bananas + Milk
     *
     * This creates/increments:
     * Tomatoes -> Bananas
     * Tomatoes -> Milk
     * Bananas -> Tomatoes
     * Bananas -> Milk
     * Milk -> Tomatoes
     * Milk -> Bananas
     *
     * Failures here must never fail the order itself.
     */
    try {
      const uniqueProductIds = [
        ...new Set(
          items.map(
            (item) => item.productId,
          ),
        ),
      ];

      if (uniqueProductIds.length >= 2) {
        for (
          const productId of uniqueProductIds
        ) {
          for (
            const pairedProductId of uniqueProductIds
          ) {
            if (
              productId ===
              pairedProductId
            ) {
              continue;
            }

            const {
              data: existingPair,
              error: pairLookupError,
            } = await supabaseAdmin
              .from(
                "product_purchase_pairs",
              )
              .select(
                "id, purchase_count",
              )
              .eq(
                "product_id",
                productId,
              )
              .eq(
                "paired_product_id",
                pairedProductId,
              )
              .maybeSingle();

            if (pairLookupError) {
              console.error(
                "Purchase pair lookup failed:",
                pairLookupError,
              );
              continue;
            }

            if (existingPair) {
              const {
                error: updatePairError,
              } = await supabaseAdmin
                .from(
                  "product_purchase_pairs",
                )
                .update({
                  purchase_count:
                    Number(
                      existingPair.purchase_count ??
                        0,
                    ) + 1,
                  last_purchased_at:
                    new Date().toISOString(),
                })
                .eq(
                  "id",
                  existingPair.id,
                );

              if (updatePairError) {
                console.error(
                  "Purchase pair update failed:",
                  updatePairError,
                );
              }
            } else {
              const {
                error: insertPairError,
              } = await supabaseAdmin
                .from(
                  "product_purchase_pairs",
                )
                .insert({
                  product_id:
                    productId,
                  paired_product_id:
                    pairedProductId,
                  purchase_count: 1,
                  last_purchased_at:
                    new Date().toISOString(),
                });

              if (insertPairError) {
                console.error(
                  "Purchase pair insert failed:",
                  insertPairError,
                );
              }
            }
          }
        }
      }
    } catch (pairTrackingError) {
      console.error(
        "Purchase pair tracking failed:",
        pairTrackingError,
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