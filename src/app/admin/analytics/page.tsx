import { Card, Kpi, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function AdminAnalytics() {
  return (
    <div>
      <PageHeader title="Analytics & reports" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="B2C GMV" value={inr(12_10_00_000, true)} />
        <Kpi label="B2B GMV" value={inr(6_30_00_000, true)} />
        <Kpi label="Take rate" value="8.8%" />
      </div>
      <Card className="mt-6 p-5 text-sm text-muted">
        Export GST GSTR-1 style settlement report, cohort retention and seller NPS from this console in production.
      </Card>
    </div>
  );
}
