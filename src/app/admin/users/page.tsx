import { users } from "@/lib/data";
import { Badge, Button, Card, PageHeader } from "@/components/ui";

export default function AdminUsers() {
  return (
    <div>
      <PageHeader title="Users" subtitle="Manage customer accounts without exposing private contact details." />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left"><tr><th className="p-3">User ID</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr></thead>
          <tbody>{users.map((u) => <tr key={u.id} className="border-t border-line"><td className="p-3 font-medium">{u.id}</td><td><Badge tone="ai">Customer</Badge></td><td><Badge tone="success">{u.status}</Badge></td><td>{u.joined}</td><td><Button size="sm" variant="outline">Manage</Button></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
