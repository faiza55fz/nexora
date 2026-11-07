"use client";

import { useEffect, useState } from "react";
import { Card, Kpi, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

type AnalyticsOrder = {
  total: number;
  status: string;
  created_at: string;
  shipped_at?: string | null;
  out_for_delivery_at?: string | null;
  delivered_at?: string | null;
  refundStatus?: string;
  refundAmount?: number;
  exchangeStatus?: string;
  order_items?: {
    product_name: string;
    quantity: number;
    price: number;
  }[];
};

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<AnalyticsOrder[]>([]);
  const [customerCount, setCustomerCount] = useState(0);

  const [customers, setCustomers] = useState<
    {
      id: string;
      name?: string;
      full_name?: string;
      email?: string;
      phone?: string;
      created_at?: string;
    }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [selectedAnalytics, setSelectedAnalytics] =
    useState<string | null>(null);

  useEffect(() => {
    if (selectedAnalytics) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedAnalytics]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/orders");
        const data = await response.json();

        if (response.ok) {
          setOrders(
            (data.orders ?? []).map(
              (order: {
                total: number;
                status: string;
                created_at: string;
                shipped_at?: string | null;
                out_for_delivery_at?: string | null;
                delivered_at?: string | null;
                refund_status?: string;
                refund_amount?: number;
                exchange_status?: string;
                order_items?: {
                  product_name: string;
                  quantity: number;
                  price: number;
                }[];
              }) => ({
                total: Number(order.total ?? 0),
                status: order.status,
                created_at: order.created_at,
                shipped_at: order.shipped_at,
                out_for_delivery_at: order.out_for_delivery_at,
                delivered_at: order.delivered_at,
                refundStatus: order.refund_status,
                refundAmount: Number(order.refund_amount ?? 0),
                exchangeStatus: order.exchange_status,
                order_items: order.order_items ?? [],
              }),
            ),
          );
        }
      } catch (error) {
        console.error("Failed to load analytics orders:", error);
      } finally {
        setLoading(false);
      }
    }

    async function loadCustomers() {
      try {
        const response = await fetch("/api/customer");
        const data = await response.json();

        if (response.ok) {
          setCustomerCount(Number(data.customerCount ?? 0));
          setCustomers(data.customers ?? []);
        }
      } catch (error) {
        console.error("Failed to load analytics customers:", error);
      }
    }

    loadOrders();
    loadCustomers();
  }, []);

  const validOrders = orders.filter(
    (order) => order.status !== "cancelled",
  );

  const gmv = validOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );

  const totalOrders = validOrders.length;

  const aov = totalOrders > 0 ? gmv / totalOrders : 0;

  const productSales = new Map<
    string,
    { quantity: number; sales: number }
  >();

  validOrders.forEach((order) => {
    order.order_items?.forEach((item) => {
      const existing = productSales.get(item.product_name) ?? {
        quantity: 0,
        sales: 0,
      };

      productSales.set(item.product_name, {
        quantity:
          existing.quantity + Number(item.quantity ?? 0),
        sales:
          existing.sales +
          Number(item.price ?? 0) * Number(item.quantity ?? 0),
      });
    });
  });

  const topProducts = Array.from(productSales.entries())
    .map(([name, data]) => ({
      name,
      quantity: data.quantity,
      sales: data.sales,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const orderStatusCounts = [
    "placed",
    "confirmed",
    "packed",
    "shipped",
    "out-for-delivery",
    "delivered",
    "cancelled",
    "return-requested",
  ].map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));

  const returnOrders = orders.filter(
    (order) => order.status === "return-requested",
  );

  const refundOrders = orders.filter(
    (order) =>
      order.refundStatus &&
      order.refundStatus !== "not_requested",
  );

  const refundedAmount = refundOrders.reduce(
    (sum, order) => sum + (order.refundAmount ?? 0),
    0,
  );

  const exchangeOrders = orders.filter(
    (order) =>
      order.exchangeStatus &&
      order.exchangeStatus !== "not_requested",
  );

  const deliveredOrders = orders.filter(
    (order) =>
      order.status === "delivered" && order.delivered_at,
  );

  const deliveryTimes = deliveredOrders
    .map((order) => {
      const startTime =
        order.out_for_delivery_at ?? order.created_at;
      const endTime = order.delivered_at;

      if (!endTime) {
        return null;
      }

      const difference =
        new Date(endTime).getTime() -
        new Date(startTime).getTime();

      return difference >= 0 ? difference : null;
    })
    .filter((time): time is number => time !== null);

  const averageDeliveryHours =
    deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, time) => sum + time, 0) /
        deliveryTimes.length /
        (1000 * 60 * 60)
      : 0;

  const completedOrCancelledOrders = orders.filter(
    (order) =>
      order.status === "delivered" ||
      order.status === "cancelled",
  );

  const deliverySuccessRate =
    completedOrCancelledOrders.length > 0
      ? (deliveredOrders.length /
          completedOrCancelledOrders.length) *
        100
      : 0;

  const salesByDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const sales = validOrders
      .filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= date && orderDate < nextDate;
      })
      .reduce((sum, order) => sum + order.total, 0);

    return {
      date: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      sales,
    };
  });

  return (
    <div>
      <PageHeader title="Analytics & reports" />

      <div className="grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setSelectedAnalytics("gmv")}
          className="text-left"
        >
          <Kpi
            label="B2C GMV"
            value={loading ? "Loading..." : inr(gmv, true)}
          />
        </button>

        <button
          type="button"
          onClick={() => setSelectedAnalytics("orders")}
          className="text-left"
        >
          <Kpi
            label="Total Orders"
            value={
              loading
                ? "Loading..."
                : totalOrders.toLocaleString("en-IN")
            }
          />
        </button>

        <button
          type="button"
          onClick={() => setSelectedAnalytics("aov")}
          className="text-left"
        >
          <Kpi
            label="AOV"
            value={loading ? "Loading..." : inr(aov, true)}
          />
        </button>

        <button
          type="button"
          onClick={() => setSelectedAnalytics("customers")}
          className="text-left"
        >
          <Kpi
            label="Customers"
            value={
              loading
                ? "Loading..."
                : customerCount.toLocaleString("en-IN")
            }
          />
        </button>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="text-lg font-semibold">Sales Trend</h2>

        <p className="mt-1 text-sm text-muted">
          B2C sales for the last 7 days
        </p>

        <div className="mt-6 space-y-4">
          {salesByDay.map((day) => (
            <div
              key={day.date}
              className="flex items-center gap-4"
            >
              <div className="w-16 text-sm text-muted">
                {day.date}
              </div>

              <div className="h-8 flex-1 rounded-md bg-muted">
                <div
                  className="h-8 rounded-md bg-teal-600"
                  style={{
                    width: `${
                      (day.sales /
                        Math.max(
                          ...salesByDay.map((item) => item.sales),
                          1,
                        )) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div className="w-28 text-right text-sm font-medium">
                {inr(day.sales, true)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="text-lg font-semibold">Top Products</h2>

        <p className="mt-1 text-sm text-muted">
          Top 5 products by sales
        </p>

        <div className="mt-5 space-y-3">
          {topProducts.length > 0 ? (
            topProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    #{index + 1}
                  </span>

                  <div>
                    <p className="text-sm font-medium">
                      {product.name}
                    </p>

                    <p className="text-xs text-muted">
                      {product.quantity.toLocaleString("en-IN")} units sold
                    </p>
                  </div>
                </div>

                <p className="text-sm font-semibold">
                  {inr(product.sales, true)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">
              No product sales data available yet.
            </p>
          )}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="text-lg font-semibold">Order Status</h2>

        <p className="mt-1 text-sm text-muted">
          Current order distribution by status
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {orderStatusCounts.map((item) => (
            <div
              key={item.status}
              className="rounded-xl border border-border p-4"
            >
              <p className="text-sm text-muted">
                {item.status
                  .replaceAll("-", " ")
                  .replace(/\b\w/g, (letter) =>
                    letter.toUpperCase(),
                  )}
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {item.count.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="text-lg font-semibold">
          Returns, Refunds & Exchanges
        </h2>

        <p className="mt-1 text-sm text-muted">
          Customer requests and refund activity
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted">Return Requests</p>
            <p className="mt-2 text-2xl font-semibold">
              {returnOrders.length.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted">Refund Requests</p>
            <p className="mt-2 text-2xl font-semibold">
              {refundOrders.length.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted">Refunded Amount</p>
            <p className="mt-2 text-2xl font-semibold">
              {inr(refundedAmount, true)}
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted">Exchange Requests</p>
            <p className="mt-2 text-2xl font-semibold">
              {exchangeOrders.length.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="text-lg font-semibold">
          Delivery Performance
        </h2>

        <p className="mt-1 text-sm text-muted">
          Delivery performance based on real order timestamps
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted">Delivered Orders</p>
            <p className="mt-2 text-2xl font-semibold">
              {deliveredOrders.length.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted">
              Delivery Success Rate
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {deliverySuccessRate.toFixed(1)}%
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted">
              Average Delivery Time
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {averageDeliveryHours > 0
                ? `${averageDeliveryHours.toFixed(1)} hrs`
                : "—"}
            </p>
          </div>
        </div>
      </Card>

      {/* GMV popup */}
      {selectedAnalytics === "gmv" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/60 p-4">
          <div className="h-[85vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  B2C GMV Details
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Gross merchandise value from non-cancelled B2C orders
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnalytics(null)}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Close
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-border p-5">
              <p className="text-sm text-muted">Total B2C GMV</p>
              <p className="mt-2 text-3xl font-semibold">
                {inr(gmv, true)}
              </p>
              <p className="mt-2 text-sm text-muted">
                Based on {totalOrders.toLocaleString("en-IN")} valid orders.
              </p>
            </div>
          </div>
        </div>
      )}

      ```tsx
{/* Orders popup */}
{selectedAnalytics === "orders" && (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-contain bg-black/60 p-4">
    <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl">

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Total Orders Details
          </h2>
          <p className="mt-1 text-sm text-muted">
            Overview of all orders
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedAnalytics(null)}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Close
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-gray-300 p-5">

        <p className="text-sm text-muted">
          Total Orders
        </p>

        <p className="mt-2 text-3xl font-semibold">
          {totalOrders.toLocaleString("en-IN")}
        </p>

        <p className="mt-2 text-sm text-muted">
          Cancelled orders are excluded from this count.
        </p>

        <div className="mt-6">
          <h3 className="mb-3 text-base font-semibold">
            Order Details
          </h3>

          {orders.length === 0 ? (
            <p className="text-sm text-muted">
              No orders available.
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order, index) => (
                <div
                  key={`${order.created_at}-${index}`}
                  className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-gray-900"
                >
                  <p className="font-medium">
                    Order #{index + 1}
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    Amount: {inr(order.total, true)}
                  </p>

                  <p className="text-sm text-muted">
                    Status: {order.status}
                  </p>

                  <p className="text-sm text-muted">
                    Date:{" "}
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString("en-IN")
                      : "Not available"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}


      {/* AOV popup */}
{selectedAnalytics === "aov" && (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-contain bg-black/60 p-4">
    <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl">

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Average Order Value Details
          </h2>

          <p className="mt-1 text-sm text-muted">
            Average amount spent per valid order
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedAnalytics(null)}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Close
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-gray-300 p-5">

        <p className="text-sm text-muted">
          Average Order Value
        </p>

        <p className="mt-2 text-3xl font-semibold">
          {inr(aov, true)}
        </p>

        <p className="mt-2 text-sm text-muted">
          Calculated using {totalOrders.toLocaleString("en-IN")} valid orders.
        </p>

        <div className="mt-6 rounded-lg border border-gray-300 bg-gray-50 p-4">
          <p className="text-sm text-muted">
            Total B2C GMV
          </p>

          <p className="mt-2 text-xl font-semibold">
            {inr(gmv, true)}
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-gray-300 bg-gray-50 p-4">
          <p className="text-sm text-muted">
            Total Valid Orders
          </p>

          <p className="mt-2 text-xl font-semibold">
            {totalOrders.toLocaleString("en-IN")}
          </p>
        </div>

      </div>
    </div>
  </div>
)}

      {/* Customers popup */}
      {selectedAnalytics === "customers" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-contain bg-black/60 p-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Customer Details
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Overview of registered customers
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnalytics(null)}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Close
              </button>
            </div>

            <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-gray-300 p-5">
              <p className="text-sm text-muted">Total Customers</p>

              <p className="mt-2 text-3xl font-semibold">
                {customerCount.toLocaleString("en-IN")}
              </p>

              <p className="mt-2 text-sm text-muted">
                Total registered customers in Nexora.
              </p>

              <div className="mt-6">
                <h3 className="mb-3 text-base font-semibold">
                  Registered Customers
                </h3>

                {customers.length === 0 ? (
                  <p className="text-sm text-muted">
                    No customer details available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-gray-900"
                      >
                        <p className="font-medium">
                          {customer.name ||
                            customer.full_name ||
                            "Name unavailable"}
                        </p>

                        <p className="mt-1 text-sm text-muted">
                          Email: {customer.email || "Not available"}
                        </p>

                        <p className="text-sm text-muted">
                          Phone: {customer.phone || "Not available"}
                        </p>

                        <p className="text-sm text-muted">
                          Registered:{" "}
                          {customer.created_at
                            ? new Date(
                                customer.created_at,
                              ).toLocaleDateString("en-IN")
                            : "Not available"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}