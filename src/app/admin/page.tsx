import { AiHint, Kpi, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function AdminHome() {
  return (
    <div>
      <PageHeader title="Marketplace control" subtitle="Nexora ops · India · IST" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="GMV MTD" value={inr(18_40_00_000, true)} trend="+11%" />
        <Kpi label="Net revenue" value={inr(1_62_00_000, true)} />
        <Kpi label="Orders" value="92,410" />
        <Kpi label="Active users" value="1.8M" />
        <Kpi label="Live sellers" value="12,640" />
      </div>
      <div className="mt-6">
        <AiHint>
          Anomaly: 14 accounts from the same device cluster placed high-AOV COD orders in Lucknow. Hold payouts and
          require prepaid.
        </AiHint>
      </div>
    </div>
  );
}
