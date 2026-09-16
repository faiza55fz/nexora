import { reviews } from "@/lib/data";
import { Card, PageHeader } from "@/components/ui";

export default function SellerReviews() {
  return (
    <div>
      <PageHeader title="Customer reviews" subtitle="Respond within 48 hours to protect ranking." />
      <div className="space-y-3">
        {reviews.map((r) => (
          <Card key={r.id} className="p-5">
            <p className="font-semibold">{r.title}</p>
            <p className="text-sm text-muted">
              {r.author} · {r.city} · {r.rating}★
            </p>
            <p className="mt-2 text-sm">{r.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
