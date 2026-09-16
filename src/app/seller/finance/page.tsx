import { Card, Kpi, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function FinancePage() {
  return (
    <div>
      <PageHeader title="Finance & settlements" subtitle="T+7 to HDFC · UPI aarav@okhdfcbank" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Available" value={inr(3_42_000)} />
        <Kpi label="In transit" value={inr(1_18_500)} />
        <Kpi label="Last payout" value={inr(2_90_000)} hint="9 Sep 2026" />
      </div>
      <Card className="mt-6 p-5 text-sm">
        <p>Commission 8% + GST. Next settlement window: Friday 18 Sep.</p>
      </Card>
    </div>
  );
}
