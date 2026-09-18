import { Kpi, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";

export default function AdminHome() {
  return (
    <div>
      <PageHeader
        title="Nexora Admin"
        subtitle="Grocery operations · India · IST"
      />

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Today's orders"
          value="128"
          trend="+8%"
        />

        <Kpi
          label="Today's sales"
          value={inr(42_680, true)}
          trend="+12%"
        />

        <Kpi
          label="Pending orders"
          value="24"
        />

        <Kpi
          label="Low-stock products"
          value="7"
        />
      </div>

      {/* Quick overview */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Order overview</h2>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">New orders</span>
              <span className="font-semibold">18</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted">Preparing</span>
              <span className="font-semibold">12</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted">Out for delivery</span>
              <span className="font-semibold">9</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted">Delivered today</span>
              <span className="font-semibold">89</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Inventory alerts</h2>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Tomatoes</span>
              <span className="font-semibold text-red-600">Low stock</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Onions</span>
              <span className="font-semibold text-red-600">Low stock</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Bananas</span>
              <span className="font-semibold text-red-600">Low stock</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Milk</span>
              <span className="font-semibold text-amber-600">Running low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent orders</h2>

          <a
            href="/admin/orders"
            className="text-sm font-semibold text-brand hover:underline"
          >
            View all
          </a>
        </div>

        <div className="mt-4 divide-y divide-line">
          {[
            ["NX-10482", "Fresh vegetables + fruits", "₹684", "Preparing"],
            ["NX-10481", "Milk, bread + eggs", "₹392", "Out for delivery"],
            ["NX-10480", "Rice, dal + groceries", "₹1,240", "Delivered"],
            ["NX-10479", "Fruits + snacks", "₹526", "Delivered"],
          ].map(([id, items, amount, status]) => (
            <div
              key={id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
            >
              <div>
                <p className="font-semibold">{id}</p>
                <p className="text-muted">{items}</p>
              </div>

              <div className="flex items-center gap-5">
                <span className="font-semibold">{amount}</span>
                <span className="text-muted">{status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}