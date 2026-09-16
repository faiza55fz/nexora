import { orders, getProduct } from "@/lib/data";
import { Button, Card } from "@/components/ui";
import { inr } from "@/lib/format";

export default function ReturnsPage() {
  const ret = orders.filter((o) => o.status === "return-requested" || o.status === "delivered");
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Returns</h1>
      <div className="mt-6 space-y-3">
        {ret.map((o) => (
          <Card key={o.id} className="p-5">
            <p className="font-semibold">{o.id}</p>
            <p className="text-sm text-muted">
              {getProduct(o.items[0].productId)?.name} · {inr(o.total)}
            </p>
            <p className="mt-2 text-sm">
              {o.status === "return-requested"
                ? "Pickup scheduled from Indiranagar. Refund to original UPI in 3–5 days after QC."
                : "Eligible for 7-day replacement."}
            </p>
            {o.status !== "return-requested" ? (
              <Button size="sm" className="mt-3">
                Start return
              </Button>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
