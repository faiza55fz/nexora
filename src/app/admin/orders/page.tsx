import Link from "next/link";
import { orders } from "@/lib/data";
import { Card, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function AdminOrders() {
  return (
    <div>
      <PageHeader
        title="Customer Orders"
        subtitle="Manage grocery orders, payments and delivery status"
      />

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted">Total orders</p>
          <p className="mt-1 text-2xl font-semibold">{orders.length}</p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">Pending orders</p>
          <p className="mt-1 text-2xl font-semibold">
            {orders.filter((o) => o.status !== "delivered").length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">COD orders</p>
          <p className="mt-1 text-2xl font-semibold">
            {orders.filter((o) => o.payment.toLowerCase().includes("cod")).length}
          </p>
        </Card>
      </div>

      {/* Orders */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="p-3">Order</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-line">
                <td className="p-3 font-medium">{o.id}</td>

                <td className="text-muted">
                  Customer
                </td>

                <td>
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium">
                    {o.payment}
                  </span>
                </td>

                <td>
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium">
                    {o.status}
                  </span>
                </td>

                <td className="font-medium">
                  {inr(o.total)}
                </td>

                <td className="pr-3 text-right">
                  <Link
                    href={`/track/${o.id}`}
                    className="text-sm font-semibold text-brand hover:underline"
                  >
                    Track
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}