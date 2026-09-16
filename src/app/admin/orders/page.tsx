import { orders } from "@/lib/data";
import { Card, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function AdminOrders() {
  return (
    <div>
      <PageHeader title="Orders & payments" subtitle="UPI, cards, COD, Net 15/30" />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="p-3">Order</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-line">
                <td className="p-3">{o.id}</td>
                <td>{o.payment}</td>
                <td>{o.status}</td>
                <td>{inr(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
