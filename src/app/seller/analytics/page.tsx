import { Card, Kpi, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function SellerAnalytics() {
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Last 30 days" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Sessions" value="48.2k" trend="+6%" />
        <Kpi label="Conversion" value="3.4%" />
        <Kpi label="AOV" value={inr(2180)} />
      </div>
      <Card className="mt-6 p-6">
        <p className="font-semibold">Traffic mix</p>
        <div className="mt-4 space-y-3 text-sm">
          {[
            ["Organic search", "42%"],
            ["Nexora ads", "28%"],
            ["Direct / app", "18%"],
            ["B2B RFQ", "12%"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span>{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
