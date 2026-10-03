"use client";

import { useEffect, useState } from "react";
import { Badge, Card, PageHeader } from "@/components/ui";

type Complaint = {
  id: string;
  order_id: string;
  order_item_id: string;
  customer_id: string;
  issue_type: string;
  description: string | null;
  status: string;
  created_at: string;
  order: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    status: string;
  } | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  item: {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  } | null;
};

function issueLabel(issueType: string) {
  switch (issueType) {
    case "missing_item":
      return "Missing item";
    case "damaged_item":
      return "Damaged item";
    case "incorrect_item":
      return "Incorrect item";
    default:
      return "Other";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DisputesPage() {
  const [complaints, setComplaints] = useState<
    Complaint[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadComplaints() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/disputes",
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load complaints.",
        );
      }

      setComplaints(data.issues ?? []);
    } catch (error) {
      console.error(
        "Loading complaints failed:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load complaints.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadComplaints();
  }, []);

  const openCount = complaints.filter(
    (complaint) =>
      complaint.status === "open" ||
      complaint.status === "pending",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints"
        subtitle="Customer-reported issues from delivered orders."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted">
            Total complaints
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {loading ? "—" : complaints.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">
            Open complaints
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {loading ? "—" : openCount}
          </p>
        </Card>
      </div>

      {loading ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="h-5 w-48 animate-pulse rounded bg-surface-2" />
            <div className="h-20 animate-pulse rounded bg-surface-2" />
            <div className="h-20 animate-pulse rounded bg-surface-2" />
            <div className="h-20 animate-pulse rounded bg-surface-2" />
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6">
          <p className="font-medium text-danger">
            Unable to load complaints
          </p>

          <p className="mt-1 text-sm text-muted">
            {error}
          </p>
        </Card>
      ) : complaints.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-lg font-semibold">
            No complaints yet
          </p>

          <p className="mt-2 text-sm text-muted">
            Customer-reported issues will appear here
            after they are submitted.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <Card
              key={complaint.id}
              className="p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="warning">
                      {issueLabel(
                        complaint.issue_type,
                      )}
                    </Badge>

                    <Badge
                      tone={
                        complaint.status ===
                          "resolved"
                          ? "success"
                          : "muted"
                      }
                    >
                      {complaint.status}
                    </Badge>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold">
                    {complaint.item?.product_name ??
                      "Product"}
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    Order{" "}
                    <span className="font-medium text-text">
                      {complaint.order
                        ?.order_number ??
                        complaint.order_id}
                    </span>
                  </p>
                </div>

                <p className="shrink-0 text-xs text-muted">
                  {formatDate(
                    complaint.created_at,
                  )}
                </p>
              </div>

              <div className="mt-5 grid gap-4 border-t border-line pt-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Customer
                  </p>

                  <p className="mt-1 font-medium">
                    {complaint.customer?.name ??
                      complaint.order
                        ?.customer_name ??
                      "Customer"}
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    {complaint.customer?.email ??
                      complaint.order
                        ?.customer_email ??
                      "—"}
                  </p>

                  <p className="text-sm text-muted">
                    {complaint.customer?.phone ??
                      complaint.order
                        ?.customer_phone ??
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Product
                  </p>

                  <p className="mt-1 font-medium">
                    {complaint.item
                      ?.product_name ??
                      "—"}
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    Quantity:{" "}
                    {complaint.item
                      ?.quantity ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Complaint ID
                  </p>

                  <p className="mt-1 break-all text-sm font-medium">
                    {complaint.id}
                  </p>
                </div>
              </div>

              {complaint.description ? (
                <div className="mt-5 rounded-xl bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Customer description
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    {complaint.description}
                  </p>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}