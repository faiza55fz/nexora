import Link from "next/link";
import { invoices, purchaseOrders, rfqs } from "@/lib/data";
import { AiHint, Button, Card, Kpi, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function B2BHome() {
  return (
    <div>
      <PageHeader
        title="Business dashboard"
        subtitle="Rao Retail Pvt Ltd · GSTIN 29AAPFR8890Q1Z3"
        actions={
          <Link href="/b2b/bulk">
            <Button variant="cta">Bulk order</Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Open POs" value="6" hint="2 in transit" />
        <Kpi label="Unpaid invoices" value={inr(72990)} hint="Net 15" trend="Due 16 Sep" />
        <Kpi label="RFQs live" value="2" hint="5 quotes" />
        <Kpi label="MTD spend" value={inr(4_82_000)} trend="+12%" hint="vs last month" />
      </div>
      <div className="mt-6">
        <AiHint>
          Reorder A4 paper and atta this week — consumption vs stock suggests a stockout by 22 Sep. Tier-3 pricing
          unlocks at 50 units.
        </AiHint>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="font-semibold">RFQs</p>
          <ul className="mt-3 space-y-3 text-sm">
            {rfqs.map((r) => (
              <li key={r.id} className="flex justify-between">
                <span>
                  {r.id} · {r.title}
                </span>
                <span className="text-muted">{r.status}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <p className="font-semibold">Purchase orders</p>
          <ul className="mt-3 space-y-3 text-sm">
            {purchaseOrders.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>
                  {p.id} · {p.seller}
                </span>
                <span>{inr(p.value)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <p className="font-semibold">Invoices & terms</p>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-2">Invoice</th>
              <th>PO</th>
              <th>Amount</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-t border-line">
                <td className="py-2">{i.id}</td>
                <td>{i.po}</td>
                <td>{inr(i.amount)}</td>
                <td>{i.due}</td>
                <td>{i.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
