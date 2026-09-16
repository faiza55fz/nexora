import { purchaseOrders } from "@/lib/data";
import { Button, Card, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function POPage() {
  return (
    <div>
      <PageHeader title="Purchase orders" subtitle="Raise POs against quotes. Reorder from last delivered PO." />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="p-3">PO</th>
              <th>Seller</th>
              <th>Value</th>
              <th>Terms</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-3">{p.id}</td>
                <td>{p.seller}</td>
                <td>{inr(p.value)}</td>
                <td>{p.terms}</td>
                <td>{p.status}</td>
                <td>
                  <Button size="sm" variant="outline">
                    Reorder
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
