"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { inr } from "@/lib/format";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  order_number: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  order_items: OrderItem[];
};

const issueTypes = [
  { value: "missing_item", label: "Missing item" },
  { value: "damaged_item", label: "Damaged item" },
  { value: "incorrect_item", label: "Incorrect item" },
  { value: "other", label: "Other problem" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingItemsOrderId, setAddingItemsOrderId] =
  useState<string | null>(null);

  const [cancellingId, setCancellingId] =
    useState<string | null>(null);

  const [confirmCancelId, setConfirmCancelId] =
    useState<string | null>(null);

  const [issueOrder, setIssueOrder] =
    useState<Order | null>(null);

  const [issueItemId, setIssueItemId] =
    useState("");

  const [issueType, setIssueType] =
    useState("");

  const [issueDropdownOpen, setIssueDropdownOpen] =
    useState(false);

  const [issueDescription, setIssueDescription] =
    useState("");

  const [submittingIssue, setSubmittingIssue] =
    useState(false);

  const [issueSuccess, setIssueSuccess] =
    useState("");

  const [issueError, setIssueError] =
    useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Please log in to view your orders.");
        return;
      }

      const response = await fetch("/api/orders/my", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load your orders.",
        );
      }

      setOrders(data.orders ?? []);
    } catch (error) {
      console.error("Loading orders failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load your orders.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(orderId: string) {
    try {
      setCancellingId(orderId);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Please log in to cancel your order.");
        return;
      }

      const response = await fetch(
        "/api/orders/cancel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            orderId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to cancel the order.",
        );
      }

      await loadOrders();
    } catch (error) {
      console.error("Cancelling order failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to cancel the order.",
      );
    } finally {
      setCancellingId(null);
    }
  }

  function openIssueModal(order: Order) {
    setIssueOrder(order);
    setIssueItemId("");
    setIssueType("");
    setIssueDropdownOpen(false);
    setIssueDescription("");
    setIssueError("");
    setIssueSuccess("");
  }

  function closeIssueModal() {
    if (submittingIssue) return;

    setIssueOrder(null);
    setIssueItemId("");
    setIssueType("");
    setIssueDropdownOpen(false);
    setIssueDescription("");
    setIssueError("");
    setIssueSuccess("");
  }

  async function handleSubmitIssue() {
    if (!issueOrder) return;

    if (!issueItemId || !issueType) {
      setIssueError(
        "Please select a product and issue type.",
      );
      return;
    }

    try {
      setSubmittingIssue(true);
      setIssueError("");
      setIssueSuccess("");
      setIssueDropdownOpen(false);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setIssueError(
          "Please log in to report an issue.",
        );
        return;
      }

      const response = await fetch(
        "/api/orders/issues",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            orderId: issueOrder.id,
            orderItemId: issueItemId,
            issueType,
            description: issueDescription.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to submit the issue.",
        );
      }

      setIssueSuccess(
        "Your issue has been reported successfully.",
      );

      setIssueItemId("");
      setIssueType("");
      setIssueDescription("");
    } catch (error) {
      console.error(
        "Submitting order issue failed:",
        error,
      );

      setIssueError(
        error instanceof Error
          ? error.message
          : "Unable to submit the issue.",
      );
    } finally {
      setSubmittingIssue(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <style jsx>{`
        @keyframes issueDropdownIn {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <Link
        href="/account"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-brand"
      >
        ← Back to account
      </Link>

      <h1 className="text-2xl font-semibold">
        Orders
      </h1>

      {loading && (
        <p className="mt-6 text-sm text-muted">
          Loading your orders...
        </p>
      )}

      {!loading && error && (
        <Card className="mt-6 p-5">
          <p className="text-sm text-red-600">
            {error}
          </p>
        </Card>
      )}

      {!loading &&
        !error &&
        orders.length === 0 && (
          <Card className="mt-6 p-6">
            <p className="font-medium">
              No orders yet
            </p>

            <p className="mt-1 text-sm text-muted">
              Your orders will appear here after you
              place an order.
            </p>

            <Link
              href="/products"
              className="mt-4 inline-block text-sm font-semibold text-brand"
            >
              Start shopping →
            </Link>
          </Card>
        )}

      <div className="mt-6 space-y-3">
        {orders.map((order) => {
          const canCancel =
            order.status === "placed" ||
            order.status === "confirmed";

          const isCancelling =
            cancellingId === order.id;

          const canReportIssue =
            order.status === "delivered";

          return (
            <Card
              key={order.id}
              className="p-5"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {order.order_number}
                  </p>

                  <p className="text-sm text-muted">
                    {new Date(
                      order.created_at,
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}{" "}
                    ·{" "}
                    {order.payment_method.toUpperCase()}{" "}
                    · {order.status}
                  </p>
                </div>

                <p className="font-semibold">
                  {inr(Number(order.total))}
                </p>
              </div>

              <ul className="mt-3 text-sm text-muted">
                {order.order_items?.map(
                  (item) => (
                    <li key={item.id}>
                      {item.product_name} ×{" "}
                      {item.quantity}
                    </li>
                  ),
                )}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <Link
                  href={`/track/${order.id}`}
                  className="text-sm font-semibold text-brand transition-all duration-200 hover:-translate-y-0.5 hover:scale-105"
                >
                  Track
                </Link>
                {canCancel && (
  <Link
    href={`/products?addToOrder=${order.id}`}
    className="text-sm font-semibold text-brand transition-all duration-200 hover:-translate-y-0.5 hover:scale-105"
  >
    Add more items
  </Link>
)}

                {canCancel && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmCancelId(order.id)
                    }
                    disabled={isCancelling}
                    className="text-sm font-semibold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:text-red-700 disabled:opacity-50"
                  >
                    {isCancelling
                      ? "Cancelling..."
                      : "Cancel order"}
                  </button>
                )}
                add
                {canReportIssue && (
                  <button
                    type="button"
                    onClick={() =>
                      openIssueModal(order)
                    }
                    className="text-[14px] leading-5 font-semibold text-brand transition-all duration-200 hover:-translate-y-0.5 hover:scale-105"
                  >
                    Report an issue
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {confirmCancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">
              Cancel order?
            </h2>

            <p className="mt-2 text-sm text-muted">
              Are you sure you want to cancel this order?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setConfirmCancelId(null)
                }
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-gray-50"
              >
                Keep order
              </button>

              <button
                type="button"
                onClick={() => {
                  const orderId =
                    confirmCancelId;

                  setConfirmCancelId(null);
                  handleCancel(orderId);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-red-700"
              >
                Cancel order
              </button>
            </div>
          </div>
        </div>
      )}

      {issueOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 font-inherit shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Report an issue
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Order {issueOrder.order_number}
                </p>
              </div>

              <button
                type="button"
                onClick={closeIssueModal}
                disabled={submittingIssue}
                className="text-xl text-muted transition hover:text-foreground disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {issueSuccess ? (
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-700">
                  {issueSuccess}
                </p>

                <button
                  type="button"
                  onClick={closeIssueModal}
                  className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <label className="text-sm font-medium">
                    Select product
                  </label>

                  <div className="relative mt-2">
                    <select
                      value={issueItemId}
                      onChange={(event) =>
                        setIssueItemId(
                          event.target.value,
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-border bg-white px-3 py-3 pr-10 text-sm font-medium text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                    >
                      <option value="">
                        Select a product
                      </option>

                      {issueOrder.order_items?.map(
                        (item) => (
                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {item.product_name} ×{" "}
                            {item.quantity}
                          </option>
                        ),
                      )}
                    </select>

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                      ↓
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-sm font-medium">
                    What went wrong?
                  </label>

                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setIssueDropdownOpen(
                          (open) => !open,
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-xl border bg-white px-3.5 py-3 text-left text-sm transition-all duration-200 ${
                        issueDropdownOpen
                          ? "border-brand ring-2 ring-brand/10"
                          : "border-border hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={
                          issueType
                            ? "font-medium text-foreground"
                            : "text-muted"
                        }
                      >
                        {issueType
                          ? issueTypes.find(
                              (issue) =>
                                issue.value ===
                                issueType,
                            )?.label
                          : "Select an issue"}
                      </span>

                      <span
                        className={`ml-3 text-xs text-muted transition-transform duration-200 ${
                          issueDropdownOpen
                            ? "rotate-180"
                            : ""
                        }`}
                      >
                        ↓
                      </span>
                    </button>

                    {issueDropdownOpen && (
                      <div
                        className="absolute left-0 right-0 z-30 mt-2 origin-top overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
                        style={{
                          animation:
                            "issueDropdownIn 160ms ease-out",
                        }}
                      >
                        <div className="p-1.5">
                          {issueTypes.map(
                            (issue) => {
                              const selected =
                                issueType ===
                                issue.value;

                              return (
                                <button
                                  key={issue.value}
                                  type="button"
                                  onClick={() => {
                                    setIssueType(
                                      issue.value,
                                    );
                                    setIssueDropdownOpen(
                                      false,
                                    );
                                  }}
                                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
                                    selected
                                      ? "bg-brand/5 font-medium text-brand"
                                      : "text-foreground hover:bg-gray-50"
                                  }`}
                                >
                                  <span>
                                    {issue.label}
                                  </span>

                                  {selected && (
                                    <span className="text-sm font-semibold text-brand">
                                      ✓
                                    </span>
                                  )}
                                </button>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-sm font-medium">
                    Additional details{" "}
                    <span className="font-normal text-muted">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    value={issueDescription}
                    onChange={(event) =>
                      setIssueDescription(
                        event.target.value,
                      )
                    }
                    maxLength={1000}
                    rows={4}
                    placeholder="Tell us what happened..."
                    className="mt-2 w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-inherit outline-none focus:border-brand"
                  />

                  <p className="mt-1 text-right text-xs text-muted">
                    {issueDescription.length}/1000
                  </p>
                </div>

                {issueError && (
                  <p className="mt-4 text-sm text-red-600">
                    {issueError}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeIssueModal}
                    disabled={submittingIssue}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitIssue}
                    disabled={submittingIssue}
                    className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 disabled:opacity-50"
                  >
                    {submittingIssue
                      ? "Submitting..."
                      : "Submit issue"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}