import Link from "next/link";
import { getProduct, orders } from "@/lib/data";
import { Card } from "@/components/ui";
import { inr } from "@/lib/format";

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <div className="mt-6 space-y-3">
        {orders.map((o) => (
          <Card key={o.id} className="p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold">{o.id}</p>
                <p className="text-sm text-muted">
                  {o.date} · {o.payment} · {o.status}
                </p>
              </div>
              <p className="font-semibold">{inr(o.total)}</p>
            </div>
            <ul className="mt-3 text-sm text-muted">
              {o.items.map((i) => (
                <li key={i.productId}>
                  {getProduct(i.productId)?.name} × {i.qty}
                </li>
              ))}
            </ul>
            <Link href={`/track/${o.id}`} className="mt-3 inline-block text-sm font-semibold text-brand">
              Track
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
