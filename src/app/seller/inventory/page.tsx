import { products } from "@/lib/data";
import { AiHint, Card, PageHeader } from "@/components/ui";

export default function InventoryPage() {
  return (
    <div>
      <PageHeader title="Inventory" subtitle="Warehouse: Bengaluru 560001" />
      <AiHint>Predicted stockout: Fresh tomatoes may run low in 3 days at the current sales rate.</AiHint>
      <Card className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="p-3">Product</th>
              <th>On hand</th>
              <th>Reserved</th>
              <th>Forecast 14d</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-3">{p.name}</td>
                <td>{p.stock}</td>
                <td>{Math.round(p.stock * 0.12)}</td>
                <td>{Math.round(p.sold / 30)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
