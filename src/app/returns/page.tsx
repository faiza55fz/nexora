"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { inr } from "@/lib/format";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  refund_status?: string;
  refund_amount?: number;
  return_reason?: string;
  exchange_status?: string;
  exchange_reason?: string;
};

const reasons = [
  "Damaged product",
  "Wrong product received",
  "Missing item",
  "Product not as expected",
  "Other",
];

export default function ReturnsPage() {
  const [order, setOrder] = useState<Order | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [requestType, setRequestType] = useState<
  "return" | "exchange"
>("return");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      const params = new URLSearchParams(
        window.location.search,
      );

      const orderId = params.get("orderId");

      if (!orderId) {
        setError("Order not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/orders", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to load order.",
          );
        }

        const orders: Order[] = Array.isArray(
          data?.orders,
        )
          ? data.orders
          : [];

        const foundOrder =
          orders.find(
            (item) =>
              item.id === orderId ||
              item.order_number === orderId,
          ) ?? null;

        if (!foundOrder) {
          setError("Order not found.");
        } else {
          setOrder(foundOrder);
          setReason(
            foundOrder.return_reason ?? "",
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load order.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, []);

  async function submitRequest() {
    if (!order || !reason) {
      setError("Please select a reason.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  orderId: order.id,
  status: order.status,
  refundStatus:
    requestType === "return"
      ? "requested"
      : undefined,
  refundAmount:
    requestType === "return"
      ? Number(order.total)
      : undefined,
  returnReason:
    requestType === "return"
      ? reason
      : undefined,
  exchangeStatus:
    requestType === "exchange"
      ? "requested"
      : undefined,
  exchangeReason:
    requestType === "exchange"
      ? reason
      : undefined,
}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to submit return request.",
        );
      }

      setOrder((current) =>
  current
    ? {
        ...current,
        refund_status:
          requestType === "return"
            ? data.order?.refund_status ??
              "requested"
            : current.refund_status,
        refund_amount:
          requestType === "return"
            ? Number(
                data.order?.refund_amount ??
                  order.total,
              )
            : current.refund_amount,
        return_reason:
          requestType === "return"
            ? data.order?.return_reason ??
              reason
            : current.return_reason,
        exchange_status:
          requestType === "exchange"
            ? data.order?.exchange_status ??
              "requested"
            : current.exchange_status,
        exchange_reason:
          requestType === "exchange"
            ? data.order?.exchange_reason ??
              reason
            : current.exchange_reason,
      }
    : current,
);

      setMessage(
        "Your return & refund request has been submitted.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="p-6">
          Loading order...
        </Card>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">
            Return & Refund
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        </Card>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const refundStatus =
  order.refund_status ?? "not_requested";

const exchangeStatus =
  order.exchange_status ?? "not_requested";

const isExchange =
  exchangeStatus !== "not_requested";

const hasRequest =
  refundStatus !== "not_requested" ||
  isExchange;

const statusLabel = isExchange
  ? exchangeStatus === "requested"
    ? "Exchange request under review"
    : exchangeStatus === "approved"
      ? "Exchange approved"
      : exchangeStatus === "rejected"
        ? "Exchange rejected"
        : exchangeStatus === "completed"
          ? "Exchange completed"
          : ""
  : refundStatus === "requested"
    ? "Request under review"
    : refundStatus === "approved"
      ? "Refund approved"
      : refundStatus === "rejected"
        ? "Refund rejected"
        : refundStatus === "refunded"
          ? "Refunded"
          : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">
        Return & Refund
      </h1>

      <p className="mt-1 text-sm text-muted">
        Order #{order.order_number}
      </p>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">
              Order total
            </p>

            <p className="mt-1 text-sm text-muted">
              {inr(Number(order.total))}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted">
              Refund status
            </p>

            <p className="mt-1 font-medium">
              {statusLabel ||
                "No request submitted"}
            </p>
          </div>
        </div>
      </Card>

      {hasRequest ? (
        <Card className="mt-4 p-6">
          <h2 className="font-semibold">
            Return & Refund Request
          </h2>
          <div className="mt-4 flex gap-2">
  <button
    type="button"
    onClick={() => setRequestType("return")}
    className={`rounded-xl px-4 py-2 text-sm font-medium ${
      requestType === "return"
        ? "bg-teal-600 text-white"
        : "border border-border hover:bg-gray-50"
    }`}
  >
    Return & Refund
  </button>

  <button
    type="button"
    onClick={() => setRequestType("exchange")}
    className={`rounded-xl px-4 py-2 text-sm font-medium ${
      requestType === "exchange"
        ? "bg-teal-600 text-white"
        : "border border-border hover:bg-gray-50"
    }`}
  >
    Exchange
  </button>
</div>

         <p className="mt-2 text-sm text-muted">
  Your {isExchange ? "exchange" : "return & refund"} request
  has been submitted to the admin.
</p>

<div className="mt-4 rounded-xl bg-muted p-4">
  <p className="text-sm">
    <span className="font-medium">
      Reason:
    </span>{" "}
    {isExchange
      ? order.exchange_reason
      : order.return_reason}
  </p>

  {isExchange ? null : (
    <p className="mt-2 text-sm">
      <span className="font-medium">
        Refund amount:
      </span>{" "}
      {inr(
        Number(
          order.refund_amount ??
            order.total,
        ),
      )}
    </p>
  )}
</div>

          {refundStatus === "refunded" ? (
            <p className="mt-4 text-sm font-medium text-green-600">
              Your refund has been completed.
            </p>
          ) : refundStatus === "rejected" ? (
            <p className="mt-4 text-sm text-red-600">
              Your refund request was rejected.
            </p>
          ) : null}
        </Card>
      ) : (
        <Card className="mt-4 p-6">
          <h2 className="font-semibold">
  {requestType === "exchange"
    ? "Request an Exchange"
    : "Request a Return or Refund"}
</h2>
<div className="mt-4 flex gap-2">
  <button
    type="button"
    onClick={() => setRequestType("return")}
    className={`rounded-xl px-4 py-2 text-sm font-medium ${
      requestType === "return"
        ? "bg-teal-600 text-white"
        : "border border-border hover:bg-gray-50"
    }`}
  >
    Return & Refund
  </button>

  <button
    type="button"
    onClick={() => setRequestType("exchange")}
    className={`rounded-xl px-4 py-2 text-sm font-medium ${
      requestType === "exchange"
        ? "bg-teal-600 text-white"
        : "border border-border hover:bg-gray-50"
    }`}
  >
    Exchange
  </button>
</div>

          <p className="mt-2 text-sm text-muted">
  {requestType === "exchange"
    ? "Please select the reason for your exchange request."
    : "Please select the reason for your return or refund request."}
</p>
          <div className="mt-4">
            <label className="text-sm font-medium">
              Reason
            </label>

            <select
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">
                Select a reason
              </option>

              {reasons.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="mt-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="mt-3 text-sm text-green-600">
              {message}
            </p>
          ) : null}

          <button
            type="button"
            onClick={submitRequest}
            disabled={
              submitting || !reason
            }
            className="mt-5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {submitting
  ? "Submitting..."
  : requestType === "exchange"
    ? "Submit Exchange Request"
    : "Submit Return & Refund Request"}
          </button>
        </Card>
      )}
    </div>
  );
}