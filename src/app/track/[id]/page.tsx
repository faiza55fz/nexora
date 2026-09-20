import { Card } from "@/components/ui";
import { inr } from "@/lib/format";

type ApiOrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
};

type ApiOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  address: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  order_items: ApiOrderItem[];
};

const timeline = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  {
    key: "out-for-delivery",
    label: "Out for delivery",
  },
  { key: "delivered", label: "Delivered" },
];

function getStatusIndex(status: string) {
  const index = timeline.findIndex(
    (item) => item.key === status,
  );

  return Math.max(0, index);
}

function formatPaymentMethod(
  paymentMethod: string,
) {
  if (paymentMethod === "cod") {
    return "Cash on Delivery";
  }

  return paymentMethod;
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  let order: ApiOrder | null = null;

  try {
    const response = await fetch(
      `${baseUrl}/api/orders`,
      {
        cache: "no-store",
      },
    );

    if (response.ok) {
      const data = await response.json();

      const orders: ApiOrder[] =
        Array.isArray(data?.orders)
          ? data.orders
          : [];

      order =
        orders.find(
          (item) =>
            item.id === id ||
            item.order_number === id,
        ) ?? null;
    }
  } catch (error) {
    console.error(
      "Failed to load tracking order:",
      error,
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">
            Order not found
          </h1>

          <p className="mt-2 text-sm text-muted">
            We couldn't find this order.
            Please check the order number and
            try again.
          </p>
        </Card>
      </div>
    );
  }

  const idx = getStatusIndex(
    order.status,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">
        Track your order 
      </h1>

      <p className="mt-1 text-sm text-muted">
        {formatPaymentMethod(
          order.payment_method,
        )}{" "}
        · {order.address}
      </p>

      <Card className="mt-6 p-6">
        <ol className="space-y-4">
          {timeline.map((t, i) => (
            <li
              key={t.key}
              className="flex gap-3"
            >
              <span
                className={`mt-1 h-3 w-3 rounded-full ${
                  i <= idx
                    ? "bg-success"
                    : "bg-line"
                }`}
              />

              <div>
                <p className="font-medium">
                  {t.label}
                </p>

                {i === idx ? (
                  <p className="text-sm text-muted">
                    Current status
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="font-semibold">
          Items
        </h2>

        <ul className="mt-3 space-y-2 text-sm">
          {order.order_items.map(
            (item) => (
              <li
                key={item.id}
                className="flex justify-between gap-4"
              >
                <span>
                  {item.product_name} ×{" "}
                  {item.quantity}
                </span>

                <span>
                  {inr(
                    Number(item.price) *
                      item.quantity,
                  )}
                </span>
              </li>
            ),
          )}
        </ul>

        <p className="mt-3 font-semibold">
          Total {inr(Number(order.total))}
        </p>
      </Card>
    </div>
  );
}