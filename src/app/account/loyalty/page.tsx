import Link from "next/link";
import { customer } from "@/lib/data";
import { Card, PageHeader } from "@/components/ui";

export default function LoyaltyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/account"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-brand"
      >
        ← Back to account
      </Link>

      <PageHeader
        title="Nexora Rewards"
        subtitle={customer.loyalty.next}
      />

      <Card className="p-6">
        <p className="text-sm text-muted">Tier</p>
        <p className="text-2xl font-semibold">{customer.loyalty.tier}</p>

        <p className="mt-4 text-sm text-muted">Points</p>
        <p className="text-3xl font-semibold">
          {customer.loyalty.points.toLocaleString("en-IN")}
        </p>

        <div className="mt-4 h-2 rounded-full bg-surface-2">
          <div className="h-2 w-[49%] rounded-full bg-brand" />
        </div>

        <ul className="mt-6 space-y-2 text-sm text-muted">
          <li>₹1 = 1 point on most orders</li>
          <li>2× points on grocery subscribe & save</li>
          <li>Redeem 500 pts = ₹50 UPI voucher</li>
        </ul>
      </Card>
    </div>
  );
}