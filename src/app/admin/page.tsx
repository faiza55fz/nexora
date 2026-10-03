"use client";

import { useEffect, useMemo, useState } from "react";
import { Kpi, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
};

type AdminProduct = {
  id: string;
  name: string;
  stock: number;
  active: boolean;
};

function isSameDay(
  value: string,
  date: Date,
) {
  const created = new Date(value);

  return (
    created.getFullYear() ===
      date.getFullYear() &&
    created.getMonth() ===
      date.getMonth() &&
    created.getDate() ===
      date.getDate()
  );
}

function isCancelled(status: string) {
  return [
    "cancelled",
    "canceled",
    "rejected",
  ].includes(status.toLowerCase());
}

function statusLabel(status: string) {
  if (status === "placed") {
    return "New";
  }

  if (
    status === "confirmed" ||
    status === "packed"
  ) {
    return "Preparing";
  }

  if (
    status === "out-for-delivery" ||
    status === "shipped"
  ) {
    return "Out for delivery";
  }

  if (status === "delivered") {
    return "Delivered";
  }

  return status;
}

export default function AdminHome() {
  const [orders, setOrders] =
    useState<AdminOrder[]>([]);

  const [products, setProducts] =
    useState<AdminProduct[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const [
          ordersResponse,
          productsResponse,
        ] = await Promise.all([
          fetch("/api/orders", {
            cache: "no-store",
          }),
          fetch("/api/products", {
            cache: "no-store",
          }),
        ]);

        const ordersData =
          await ordersResponse.json();

        const productsData =
          await productsResponse.json();

        if (
          !ordersResponse.ok ||
          !ordersData?.orders
        ) {
          throw new Error(
            ordersData?.error ||
              "Unable to load orders.",
          );
        }

        if (
          !productsResponse.ok ||
          !productsData?.success
        ) {
          throw new Error(
            productsData?.error ||
              "Unable to load products.",
          );
        }

        const mappedOrders: AdminOrder[] =
          (ordersData.orders ?? []).map(
            (order: any) => ({
              id: order.id,
              orderNumber:
                order.order_number,
              customerName:
                order.customer_name ||
                "Customer",
              subtotal:
                Number(order.subtotal) ||
                0,
              deliveryFee:
                Number(
                  order.delivery_fee,
                ) || 0,
              total:
                Number(order.total) || 0,
              status:
                order.status || "placed",
              createdAt:
                order.created_at,
              items:
                Array.isArray(
                  order.order_items,
                )
                  ? order.order_items.map(
                      (item: any) => ({
                        id: item.id,
                        productId:
                          item.product_id,
                        productName:
                          item.product_name ||
                          "Product",
                        quantity:
                          Number(
                            item.quantity,
                          ) || 0,
                        price:
                          Number(
                            item.price,
                          ) || 0,
                      }),
                    )
                  : [],
            }),
          );

        const mappedProducts: AdminProduct[] =
          (productsData.products ?? []).map(
            (product: any) => {
              const variant =
                product.product_variants?.[0];

              const inventory =
                variant?.inventory;

              return {
                id: product.id,
                name:
                  product.name ||
                  "Product",
                stock:
                  Number(
                    inventory?.stock_quantity,
                  ) || 0,
                active:
                  product.active !== false,
              };
            },
          );

        setOrders(mappedOrders);
        setProducts(mappedProducts);
      } catch (error) {
        console.error(
          "Failed to load admin overview:",
          error,
        );

        setOrders([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

  const today = useMemo(
    () => new Date(),
    [],
  );

  const todayOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          isSameDay(
            order.createdAt,
            today,
          ) &&
          !isCancelled(order.status),
      ),
    [orders, today],
  );

  const todaysSales = useMemo(
    () =>
      todayOrders.reduce(
        (sum, order) =>
          sum + order.total,
        0,
      ),
    [todayOrders],
  );

  const pendingOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          ![
            "delivered",
            "cancelled",
            "canceled",
            "rejected",
          ].includes(
            order.status.toLowerCase(),
          ),
      ).length,
    [orders],
  );

  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.active &&
          product.stock <= 10,
      ),
    [products],
  );

  const newOrders = useMemo(
    () =>
      todayOrders.filter(
        (order) =>
          order.status === "placed",
      ).length,
    [todayOrders],
  );

  const preparingOrders = useMemo(
    () =>
      todayOrders.filter(
        (order) =>
          order.status ===
            "confirmed" ||
          order.status === "packed",
      ).length,
    [todayOrders],
  );

  const outForDeliveryOrders =
    useMemo(
      () =>
        todayOrders.filter(
          (order) =>
            order.status ===
              "out-for-delivery" ||
            order.status === "shipped",
        ).length,
      [todayOrders],
    );

  const deliveredToday =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.status ===
              "delivered" &&
            isSameDay(
              order.createdAt,
              today,
            ),
        ).length,
      [orders, today],
    );

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime(),
        )
        .slice(0, 4),
    [orders],
  );

  const inventoryAlerts = useMemo(
    () =>
      [...lowStockProducts]
        .sort(
          (a, b) =>
            a.stock - b.stock,
        )
        .slice(0, 4),
    [lowStockProducts],
  );

  return (
    <div>
      <PageHeader
        title="SundayShop Admin"
        subtitle="Grocery operations · India · IST"
      />

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Today's orders"
          value={
            loading
              ? "—"
              : String(
                  todayOrders.length,
                )
          }
        />

        <Kpi
          label="Today's sales"
          value={
            loading
              ? "—"
              : inr(
                  todaysSales,
                  true,
                )
          }
        />

        <Kpi
          label="Pending orders"
          value={
            loading
              ? "—"
              : String(
                  pendingOrders,
                )
          }
        />

        <Kpi
          label="Low-stock products"
          value={
            loading
              ? "—"
              : String(
                  lowStockProducts.length,
                )
          }
        />
      </div>

      {/* Quick overview */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">
            Order overview
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">
                New orders
              </span>

              <span className="font-semibold">
                {loading
                  ? "—"
                  : newOrders}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted">
                Preparing
              </span>

              <span className="font-semibold">
                {loading
                  ? "—"
                  : preparingOrders}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted">
                Out for delivery
              </span>

              <span className="font-semibold">
                {loading
                  ? "—"
                  : outForDeliveryOrders}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted">
                Delivered today
              </span>

              <span className="font-semibold">
                {loading
                  ? "—"
                  : deliveredToday}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">
            Inventory alerts
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            {loading ? (
              <p className="text-muted">
                Loading inventory...
              </p>
            ) : inventoryAlerts.length ===
              0 ? (
              <p className="text-muted">
                No low-stock products.
              </p>
            ) : (
              inventoryAlerts.map(
                (product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {product.name}
                    </span>

                    <span
                      className={`font-semibold ${
                        product.stock <=
                        5
                          ? "text-red-600"
                          : "text-amber-600"
                      }`}
                    >
                      {product.stock <=
                      5
                        ? "Low stock"
                        : "Running low"}
                    </span>
                  </div>
                ),
              )
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            Recent orders
          </h2>

          <a
            href="/admin/orders"
            className="text-sm font-semibold text-brand hover:underline"
          >
            View all
          </a>
        </div>

        <div className="mt-4 divide-y divide-line">
          {loading ? (
            <div className="py-6 text-sm text-muted">
              Loading recent orders...
            </div>
          ) : recentOrders.length ===
            0 ? (
            <div className="py-6 text-sm text-muted">
              No orders yet.
            </div>
          ) : (
            recentOrders.map(
              (order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
                >
                  <div>
                    <p className="font-semibold">
                      {
                        order.orderNumber
                      }
                    </p>

                    <p className="text-muted">
                      {order.items.length >
                      0
                        ? order.items
                            .map(
                              (
                                item,
                              ) =>
                                item.productName,
                            )
                            .slice(
                              0,
                              3,
                            )
                            .join(
                              ", ",
                            )
                        : "Order"}
                    </p>
                  </div>

                  <div className="flex items-center gap-5">
                    <span className="font-semibold">
                      {inr(
                        order.total,
                        true,
                      )}
                    </span>

                    <span className="text-muted">
                      {statusLabel(
                        order.status,
                      )}
                    </span>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}