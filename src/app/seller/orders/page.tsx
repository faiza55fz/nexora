import { orders, products } from "@/lib/data";
import { Button, Card, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

const nextAction = (status: string) => {
  if (status === "placed") return "Accept order";
  if (status === "confirmed") return "Start preparing";
  if (status === "packed") return "Mark ready";
  return "View order";
};

export default function SellerOrders() {
  return (
    <div>
      <PageHeader title="Orders" subtitle="Big, simple order cards — no complicated tables." />
      <div className="space-y-4">
        {orders.map((o) => (
          <Card key={o.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold">Order {o.id}</p>
                <p className="mt-1 text-sm text-muted">{o.date} · {o.payment}</p>
              </div>
              <span className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${o.status === "delivered" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                {o.status.replaceAll("-", " ")}
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-surface-2 p-4">
              <p className="font-semibold">Items in this order</p>
              <ul className="mt-2 space-y-1 text-sm">
                {o.items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  return <li key={item.productId} className="flex justify-between gap-3"><span>{item.qty} × {product?.name ?? "Grocery item"}</span><strong>{inr(item.price * item.qty)}</strong></li>;
                })}
              </ul>
              <div className="mt-3 flex justify-between border-t border-line pt-3"><strong>Total</strong><strong>{inr(o.total)}</strong></div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-xl text-sm text-muted"><strong>Deliver to:</strong> {o.address}</p>
              {o.status !== "delivered" && <Button size="lg">{nextAction(o.status)}</Button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
