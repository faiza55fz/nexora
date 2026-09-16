import { Card } from "@/components/ui";
import { orders, getProduct } from "@/lib/data";
import { inr } from "@/lib/format";

const timeline = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out-for-delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = orders.find((o) => o.id === id) ?? orders[0];
  const idx = Math.max(
    0,
    timeline.findIndex((t) => t.key === order.status),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Track {order.id}</h1>
      <p className="mt-1 text-sm text-muted">
        {order.payment} · ETA {order.eta ?? "Delivered"} · {order.address}
      </p>
      <Card className="mt-6 p-6">
        <ol className="space-y-4">
          {timeline.map((t, i) => (
            <li key={t.key} className="flex gap-3">
              <span
                className={`mt-1 h-3 w-3 rounded-full ${i <= idx ? "bg-success" : "bg-line"}`}
              />
              <div>
                <p className="font-medium">{t.label}</p>
                {i === idx ? <p className="text-sm text-muted">Current status</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <Card className="mt-4 p-6">
        <h2 className="font-semibold">Items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {order.items.map((i) => {
            const p = getProduct(i.productId);
            return (
              <li key={i.productId} className="flex justify-between">
                <span>
                  {p?.name} × {i.qty}
                </span>
                <span>{inr(i.price * i.qty)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 font-semibold">Total {inr(order.total)}</p>
      </Card>
    </div>
  );
}
