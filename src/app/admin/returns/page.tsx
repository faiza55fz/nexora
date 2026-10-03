"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, PageHeader, Badge, Button } from "@/components/ui";

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  total: number;
  status: string;
  refundStatus?: string | null;
  refundAmount?: number | null;
  returnReason?: string | null;
  exchangeStatus?: string | null;
  exchangeReason?: string | null;
  createdAt: string;
  items: OrderItem[];
};

export default function AdminReturns() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [refundRequests, setRefundRequests] =
  useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/orders", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "Unable to load return requests.",
        );
      }

      const mappedOrders: AdminOrder[] =
        (data.orders ?? []).map((order: any) => ({
          id: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone ?? "",
          address: order.address,
          total: Number(order.total ?? 0),
          status: order.status ?? "placed",
          refundStatus: order.refund_status ?? null,
          refundAmount:
            order.refund_amount !== null &&
            order.refund_amount !== undefined
              ? Number(order.refund_amount)
              : null,
          returnReason: order.return_reason ?? null,
          exchangeStatus:
            order.exchange_status ?? null,
          exchangeReason:
            order.exchange_reason ?? null,
          createdAt: order.created_at,
          items: Array.isArray(order.order_items)
            ? order.order_items.map((item: any) => ({
                id: item.id,
                productId: item.product_id,
                productName: item.product_name,
                quantity: Number(item.quantity ?? 0),
                price: Number(item.price ?? 0),
              }))
            : [],
        }));

      setOrders(mappedOrders);
      setRefundRequests(
  Array.isArray(data.refundRequests)
    ? data.refundRequests
    : [],
);
    } catch (error) {
      console.error("Returns loading error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load return requests.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  async function updateRequest(
    order: AdminOrder,
    updates: {
      refundStatus?: string;
      refundAmount?: number;
      exchangeStatus?: string;
    },
  ) {
    try {
      setUpdatingId(order.id);
      setError("");

      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          status:
            order.status === "cancelled"
              ? "cancelled"
              : "return-requested",
          ...updates,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "Unable to update request.",
        );
      }

      await loadOrders();
    } catch (error) {
      console.error("Return update error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update request.",
      );
    } finally {
      setUpdatingId(null);
    }
  }
  async function updateRefundRequest(
  requestId: string,
  status: "approved" | "rejected"| "refunded",
) {
  try {
    setUpdatingId(requestId);
    setError("");

    const response = await fetch(
      "/api/orders/issues",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          issueId: requestId,
          status,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "Unable to update refund request.",
      );
    }

    await loadOrders();
  } catch (error) {
    console.error(
      "Refund request update error:",
      error,
    );

    setError(
      error instanceof Error
        ? error.message
        : "Unable to update refund request.",
    );
  } finally {
    setUpdatingId(null);
  }
}

  const returnRequests = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.refundStatus &&
          order.refundStatus !== "not_requested",
      ),
    [orders],
  );

 const pendingRefundRequests = useMemo(
  () =>
    refundRequests.filter(
      (request) =>
        request.status === "pending" ||
        request.status === "requested" ||
        request.status === "approved",
    ),
  [refundRequests],
);

  const exchangeRequests = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.exchangeStatus &&
          order.exchangeStatus !== "not_requested",
      ),
    [orders],
  );

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  function statusLabel(status?: string | null) {
    if (!status) return "Not requested";

    return status
      .replaceAll("-", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      );
  }

  return (
    <div>
      <PageHeader title="Returns & refunds" />

      {error ? (
        <Card className="mb-6 border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </Card>
      ) : null}

      {loading ? (
        <Card className="p-5">
          <p className="text-sm text-muted">
            Loading return requests...
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          <section>
  <div className="mb-4">
    <h2 className="text-lg font-semibold text-ink">
      Customer refund requests
    </h2>

    <p className="mt-1 text-sm text-muted">
      Review refund requests submitted after delivered orders.
    </p>
  </div>

  {pendingRefundRequests.length === 0 ? (
    <Card className="p-5">
      <p className="text-sm text-muted">
        No pending refund requests.
      </p>
    </Card>
  ) : (
    <div className="space-y-4">
      {pendingRefundRequests.map((request) => {
        const order = Array.isArray(request.orders)
          ? request.orders[0]
          : request.orders;

        const item = Array.isArray(request.order_items)
          ? request.order_items[0]
          : request.order_items;

        return (
          <Card
            key={request.id}
            className="p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-semibold text-ink">
                  {order?.order_number || "Order"}
                </p>

                <p className="mt-1 text-sm text-muted">
                  {order?.customer_name || "Customer"} ·{" "}
                  {order?.customer_email || "No email"}
                </p>

                <p className="mt-1 text-sm text-muted">
                  Requested {formatDate(request.created_at)}
                </p>
              </div>

              <Badge tone="muted">
                {statusLabel(request.status)}
              </Badge>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Product
              </p>

              <p className="mt-2 text-sm font-semibold text-ink">
                {item?.product_name || "Product"}
              </p>

              <p className="mt-1 text-xs text-muted">
                Quantity: {item?.quantity ?? 0}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Refund reason
              </p>

              <p className="mt-2 text-sm leading-6 text-ink">
                {String(request.description || "")
                  .replace(/^REFUND REQUEST:\s*/i, "")
                  .trim() || "No reason provided."}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                disabled={updatingId === request.id}
                onClick={() =>
  updateRefundRequest(
    request.id,
    "approved",
  )
}
              >
                Approve refund
              </Button>

              <Button
                variant="outline"
                disabled={updatingId === request.id}
                onClick={() => {
                  updateRefundRequest(
    request.id,
    "rejected",
  )
                }}
              >
                Reject
              </Button>
              {request.status === "approved" ? (
                <Button
                   disabled={updatingId === request.id}
                   onClick={() =>
                     updateRefundRequest(
                     request.id,
                    "refunded",
                   )
                  }
                >
    Mark as refunded
  </Button>
) : null}

            </div>
          </Card>
        );
      })}
    </div>
  )}
</section>
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-ink">
                Returns & refunds
              </h2>
              <p className="mt-1 text-sm text-muted">
                Manage customer return and refund requests.
              </p>
            </div>

            {returnRequests.length === 0 ? (
              <Card className="p-5">
                <p className="text-sm text-muted">
                  No return or refund requests.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {returnRequests.map((order) => (
                  <Card
                    key={order.id}
                    className="p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold text-ink">
                          {order.orderNumber}
                        </p>

                        <p className="mt-1 text-sm text-muted">
                          {order.customerName} ·{" "}
                          {order.customerEmail}
                        </p>

                        <p className="mt-1 text-sm text-muted">
                          Requested{" "}
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <Badge tone="muted">
                        {statusLabel(
                          order.refundStatus,
                        )}
                      </Badge>
                    </div>

                    <div className="mt-5 rounded-xl border border-border bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Items
                      </p>

                      <div className="mt-3 space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between gap-4 text-sm"
                          >
                            <span className="text-ink">
                              {item.productName} ×{" "}
                              {item.quantity}
                            </span>

                            <span className="text-muted">
                              ₹
                              {(
                                item.price *
                                item.quantity
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted">
                          Return reason
                        </p>

                        <p className="mt-1 text-sm text-ink">
                          {order.returnReason ||
                            "No reason provided."}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted">
                          Refund amount
                        </p>

                        <p className="mt-1 text-sm font-semibold text-ink">
                          ₹
                          {Number(
                            order.refundAmount ??
                              order.total,
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {order.refundStatus ===
                      "requested" ? (
                        <>
                          <Button
                            disabled={
                              updatingId ===
                              order.id
                            }
                            onClick={() =>
                              updateRequest(
                                order,
                                {
                                  refundStatus:
                                    "approved",
                                  refundAmount:
                                    Number(
                                      order.refundAmount ??
                                        order.total,
                                    ),
                                },
                              )
                            }
                          >
                            Approve refund
                          </Button>

                          <Button
                            variant="outline"
                            disabled={
                              updatingId ===
                              order.id
                            }
                            onClick={() =>
                              updateRequest(
                                order,
                                {
                                  refundStatus:
                                    "rejected",
                                },
                              )
                            }
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}

                      {order.refundStatus ===
                      "approved" ? (
                        <Button
                          disabled={
                            updatingId ===
                            order.id
                          }
                          onClick={() =>
                            updateRequest(
                              order,
                              {
                                refundStatus:
                                  "refunded",
                                refundAmount:
                                  Number(
                                    order.refundAmount ??
                                      order.total,
                                  ),
                              },
                            )
                          }
                        >
                          Mark as refunded
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-ink">
                Exchange requests
              </h2>

              <p className="mt-1 text-sm text-muted">
                Manage customer exchange requests.
              </p>
            </div>

            {exchangeRequests.length === 0 ? (
              <Card className="p-5">
                <p className="text-sm text-muted">
                  No exchange requests.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {exchangeRequests.map((order) => (
                  <Card
                    key={order.id}
                    className="p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold text-ink">
                          {order.orderNumber}
                        </p>

                        <p className="mt-1 text-sm text-muted">
                          {order.customerName} ·{" "}
                          {order.customerEmail}
                        </p>
                      </div>

                      <Badge tone="muted">
                        {statusLabel(
                          order.exchangeStatus,
                        )}
                      </Badge>
                    </div>

                    <div className="mt-4 rounded-xl border border-border bg-white p-4">
                      <p className="text-xs text-muted">
                        Exchange reason
                      </p>

                      <p className="mt-1 text-sm text-ink">
                        {order.exchangeReason ||
                          "No reason provided."}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl border border-border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Items
                      </p>

                      <div className="mt-3 space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="text-sm text-ink"
                          >
                            {item.productName} ×{" "}
                            {item.quantity}
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.exchangeStatus ===
                    "requested" ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button
                          disabled={
                            updatingId ===
                            order.id
                          }
                          onClick={() =>
                            updateRequest(
                              order,
                              {
                                exchangeStatus:
                                  "approved",
                              },
                            )
                          }
                        >
                          Approve exchange
                        </Button>

                        <Button
                          variant="outline"
                          disabled={
                            updatingId ===
                            order.id
                          }
                          onClick={() =>
                            updateRequest(
                              order,
                              {
                                exchangeStatus:
                                  "rejected",
                              },
                            )
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                    {order.exchangeStatus === "approved" ? (
  <Button
    disabled={updatingId === order.id}
    onClick={() =>
      updateRequest(order, {
        exchangeStatus: "completed",
      })
    }
  >
    Mark exchange completed
  </Button>
) : null}
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}