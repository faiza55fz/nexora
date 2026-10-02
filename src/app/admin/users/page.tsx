"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, PageHeader } from "@/components/ui";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastActivityAt: string | null;
  status: "active" | "inactive";
};

function formatActivityDate(value: string | null) {
  if (!value) return "No activity recorded";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminUsers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load customers.",
        );
      }

      setCustomers(data.customers ?? []);
    } catch (error) {
      console.error("Loading customers failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load customers.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
   void loadCustomers();
  }, []);

  const activeCustomers = useMemo(
    () =>
      customers.filter(
        (customer) => customer.status === "active",
      ).length,
    [customers],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Manage real SundayShop customer accounts and recent activity."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted">
            Total customers
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {loading ? "—" : customers.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">
            Active customers
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {loading ? "—" : activeCustomers}
          </p>

          <p className="mt-1 text-xs text-muted">
            Activity within the last 30 days
          </p>
        </Card>
      </div>

      {loading ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="h-5 w-40 animate-pulse rounded bg-surface-2" />
            <div className="h-12 animate-pulse rounded bg-surface-2" />
            <div className="h-12 animate-pulse rounded bg-surface-2" />
            <div className="h-12 animate-pulse rounded bg-surface-2" />
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6">
          <p className="font-medium text-danger">
            Unable to load customers
          </p>

          <p className="mt-1 text-sm text-muted">
            {error}
          </p>
        </Card>
      ) : customers.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-lg font-semibold">
            No customers yet
          </p>

          <p className="mt-2 text-sm text-muted">
            Customers will appear here after they create
            accounts.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-surface-2 text-left">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last activity</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-t border-line"
                >
                  <td className="p-3">
                    <div>
                      <p className="font-medium">
                        {customer.name}
                      </p>

                      <p className="mt-1 max-w-[260px] truncate text-xs text-muted">
                        ID: {customer.id}
                      </p>
                    </div>
                  </td>

                  <td className="p-3">
                    {customer.email || "—"}
                  </td>

                  <td className="p-3">
                    {customer.phone || "—"}
                  </td>

                  <td className="p-3">
                    {customer.status === "active" ? (
                      <Badge tone="success">
                        Active
                      </Badge>
                    ) : (
                      <Badge tone="muted">
                        Inactive
                      </Badge>
                    )}
                  </td>

                  <td className="p-3 text-muted">
                    {formatActivityDate(
                      customer.lastActivityAt,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}