import { products } from "@/lib/data";
import { Button, Card, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function AdminCatalog() {
  return (
    <div>
      <PageHeader title="Catalog" subtitle="Moderate listings, GST HSN and category mapping." />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="p-3">Product</th>
              <th>Category</th>
              <th>Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-3">{p.name}</td>
                <td>{p.category}</td>
                <td>{inr(p.price)}</td>
                <td>
                  <Button size="sm" variant="outline">
                    Review
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
