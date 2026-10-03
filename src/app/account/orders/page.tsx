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
  <div className="mx-auto max-w-5xl px-4 py-6 pb-12 sm:px-6 sm:py-8">
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

      @keyframes orderCardIn {
        from {
          opacity: 0;
          transform: translateY(6px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `}</style>

    {/* Back */}
    <Link
      href="/account"
      className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-brand"
    >
      ← Back to account
    </Link>

    {/* Page header */}
    <div className="mb-6">
      <p className="text-sm font-medium text-brand">
        Shopping history
      </p>

      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Your orders
          </h1>

          <p className="mt-1 text-sm text-muted">
            Track your purchases, manage orders and get help when you need it.
          </p>
        </div>

        {!loading && !error && orders.length > 0 && (
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {orders.length}{" "}
            {orders.length === 1 ? "order" : "orders"}
          </span>
        )}
      </div>
    </div>

    {/* Loading state */}
    {loading && (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <Card
            key={item}
            className="overflow-hidden p-0"
          >
            <div className="animate-pulse p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="h-3 w-48 rounded bg-slate-100" />
                </div>

                <div className="h-6 w-20 rounded-full bg-slate-100" />
              </div>

              <div className="mt-5 space-y-2">
                <div className="h-3 w-3/4 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
              </div>

              <div className="mt-5 h-10 rounded-xl bg-slate-100" />
            </div>
          </Card>
        ))}
      </div>
    )}

    {/* Error */}
    {!loading && error && (
      <Card className="border-red-100 bg-red-50/40 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            !
          </div>

          <div>
            <p className="font-semibold text-red-700">
              Unable to load your orders
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={loadOrders}
              className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-50 active:scale-[0.98]"
            >
              Try again
            </button>
          </div>
        </div>
      </Card>
    )}

    {/* Empty state */}
    {!loading &&
      !error &&
      orders.length === 0 && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col items-center px-6 py-12 text-center sm:py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-4xl">
              🛒
            </div>

            <h2 className="mt-5 text-xl font-bold text-ink">
              No orders yet
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
              Once you place your first grocery order, you'll
              be able to track and manage it here.
            </p>

            <Link
              href="/products"
              className="mt-6 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              Start shopping
            </Link>
          </div>
        </Card>
      )}

    {/* Orders */}
    {!loading &&
      !error &&
      orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order, index) => {
            const canCancel =
              order.status === "placed" ||
              order.status === "confirmed";

            const isCancelling =
              cancellingId === order.id;

            const canReportIssue =
              order.status === "delivered";

            const normalizedStatus =
              order.status.toLowerCase();

            const statusConfig =
              normalizedStatus === "delivered"
                ? {
                    label: "Delivered",
                    className:
                      "bg-emerald-50 text-emerald-700 ring-emerald-100",
                  }
                : normalizedStatus === "cancelled" ||
                    normalizedStatus === "canceled"
                  ? {
                      label: "Cancelled",
                      className:
                        "bg-red-50 text-red-700 ring-red-100",
                    }
                  : normalizedStatus === "out-for-delivery"
                    ? {
                        label: "Out for delivery",
                        className:
                          "bg-blue-50 text-blue-700 ring-blue-100",
                      }
                    : normalizedStatus === "confirmed"
                      ? {
                          label: "Confirmed",
                          className:
                            "bg-indigo-50 text-indigo-700 ring-indigo-100",
                        }
                      : {
                          label:
                            normalizedStatus.charAt(0).toUpperCase() +
                            normalizedStatus.slice(1),
                          className:
                            "bg-amber-50 text-amber-700 ring-amber-100",
                        };

            return (
              <Card
                key={order.id}
                className="overflow-hidden border-border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md "
                
                
              >
                {/* Order header */}
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-bold text-ink">
                          {order.order_number}
                        </p>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-muted">
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
                        {order.payment_method.toUpperCase()}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xs text-muted">
                        Order total
                      </p>

                      <p className="mt-1 text-xl font-bold tracking-tight text-ink">
                        {inr(Number(order.total))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order items */}
                <div className="p-5 sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">
                      Items
                    </p>

                    <span className="text-xs text-muted">
                      {order.order_items?.length || 0}{" "}
                      {order.order_items?.length === 1
                        ? "product"
                        : "products"}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <ul className="divide-y divide-slate-200/80">
                      {order.order_items?.map(
                        (item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-1"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">
                                {item.product_name}
                              </p>

                              <p className="mt-0.5 text-xs text-muted">
                                Quantity: {item.quantity}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-semibold text-ink">
                              {inr(
                                Number(item.price) *
                                  Number(item.quantity),
                              )}
                            </p>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Price summary */}
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">
                        Subtotal
                      </span>

                      <span className="font-medium text-ink">
                        {inr(Number(order.subtotal))}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted">
                        Delivery
                      </span>

                      <span className="font-medium text-ink">
                        {Number(order.delivery_fee) === 0
                          ? "Free"
                          : inr(Number(order.delivery_fee))}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-slate-100 pt-2">
                      <span className="font-semibold text-ink">
                        Total
                      </span>

                      <span className="font-bold text-ink">
                        {inr(Number(order.total))}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/track/${order.id}`}
                      className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]"
                    >
                      Track order
                    </Link>

                    {canCancel && (
                      <Link
                        href={`/products?addToOrder=${order.id}`}
                        className="inline-flex items-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-2 active:scale-[0.97]"
                      >
                        Add more items
                      </Link>
                    )}

                    {canReportIssue && (
                      <button
                        type="button"
                        onClick={() =>
                          openIssueModal(order)
                        }
                        className="inline-flex items-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-2 active:scale-[0.97]"
                      >
                        Report an issue
                      </button>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmCancelId(order.id)
                        }
                        disabled={isCancelling}
                        className="inline-flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 active:scale-[0.97] disabled:opacity-50"
                      >
                        {isCancelling
                          ? "Cancelling..."
                          : "Cancel order"}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

    {/* Cancel confirmation */}
    {confirmCancelId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
            !
          </div>

          <h2 className="mt-4 text-lg font-bold text-ink">
            Cancel order?
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            Are you sure you want to cancel this order?
            This action may not be reversible.
          </p>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                setConfirmCancelId(null)
              }
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]"
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
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-700 active:scale-[0.98]"
            >
              Cancel order
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Issue modal */}
    {issueOrder && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 font-inherit shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                Order support
              </p>

              <h2 className="mt-1 text-lg font-bold text-ink">
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
              className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-muted transition hover:bg-slate-100 hover:text-foreground disabled:opacity-50"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {issueSuccess ? (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                ✓
              </div>

              <p className="mt-3 text-sm font-semibold text-green-700">
                {issueSuccess}
              </p>

              <p className="mt-1 text-sm text-green-700/80">
                Our team can now review the issue with your order.
              </p>

              <button
                type="button"
                onClick={closeIssueModal}
                className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6">
                <label className="text-sm font-semibold text-ink">
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
                <label className="text-sm font-semibold text-ink">
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
                <label className="text-sm font-semibold text-ink">
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
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-inherit outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />

                <p className="mt-1 text-right text-xs text-muted">
                  {issueDescription.length}/1000
                </p>
              </div>

              {issueError && (
                <div className="mt-4 rounded-xl bg-red-50 p-3">
                  <p className="text-sm text-red-600">
                    {issueError}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeIssueModal}
                  disabled={submittingIssue}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmitIssue}
                  disabled={submittingIssue}
                  className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
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