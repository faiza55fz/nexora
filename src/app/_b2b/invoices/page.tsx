import { invoices } from "@/lib/data";
import { Card, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function InvoicesPage() {
  return (
    <div>
      <PageHeader title="Invoices & payment terms" subtitle="GST split shown. Pay via UPI, NEFT or Net 15/30." />
      <div className="space-y-3">
        {invoices.map((i) => (
          <Card key={i.id} className="p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold">{i.id}</p>
                <p className="text-sm text-muted">
                  Against {i.po} · GST {inr(i.gst)} · Due {i.due}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{inr(i.amount)}</p>
                <p className="text-sm text-muted">{i.status}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
