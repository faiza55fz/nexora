import { sellers } from "@/lib/data";
import { Badge, Button, Card, PageHeader } from "@/components/ui";

export default function AdminSellers() {
  return (
    <div>
      <PageHeader title="Sellers" subtitle="Approve and manage vendor accounts. Private business/contact details stay hidden in this overview." />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left"><tr><th className="p-3">Seller ID</th><th>Store</th><th>Status</th><th>Rating</th><th></th></tr></thead>
          <tbody>{sellers.map((s) => <tr key={s.id} className="border-t border-line"><td className="p-3 font-medium">{s.id}</td><td>{s.name}</td><td><Badge tone={s.kyc === "verified" ? "success" : "warning"}>{s.kyc}</Badge></td><td>{s.rating} ★</td><td>{s.kyc !== "verified" ? <Button size="sm">Review</Button> : <Button size="sm" variant="outline">Manage</Button>}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
