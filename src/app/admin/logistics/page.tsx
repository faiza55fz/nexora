
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  PageHeader,
  Button,
  Input,
  Select,
} from "@/components/ui";

type DeliveryStatus =
  | "available"
  | "assigned"
  | "on-delivery"
  | "offline";

type DeliveryMember = {
  id: string;
  name: string;
  phone: string;
  status: DeliveryStatus;
  area: string;
};

function normalizeStatus(status: string): DeliveryStatus {
  if (status === "on-delivery" || status === "out-on-delivery") {
    return "on-delivery";
  }

  if (
    status === "assigned" ||
    status === "offline"
  ) {
    return status;
  }

  return "available";
}

function statusLabel(status: DeliveryStatus) {
  if (status === "available") return "Available";
  if (status === "assigned") return "Assigned";
  if (status === "on-delivery") return "On delivery";
  return "Offline";
}

function statusClass(status: DeliveryStatus) {
  if (status === "available") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "assigned" || status === "on-delivery") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function LogisticsPage() {
  const [members, setMembers] = useState<DeliveryMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] =
    useState<DeliveryStatus>("available");

  async function loadMembers() {
    try {
      setError("");

      const response = await fetch(
        "/api/admin/delivery-partners",
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load delivery members",
        );
      }

      setMembers(
        (data.partners ?? []).map((partner: any) => ({
          id: partner.id,
          name: partner.name,
          phone: partner.phone,
          area: partner.area ?? "",
          status: normalizeStatus(partner.status),
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load delivery members",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function addMember() {
    if (!name.trim() || !phone.trim() || !area.trim()) {
      setError("Please fill in name, phone and area.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/admin/delivery-partners",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            area: area.trim(),
            status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add member");
      }

      await loadMembers();

      setName("");
      setPhone("");
      setArea("");
      setStatus("available");
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add delivery member",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    id: string,
    nextStatus: DeliveryStatus,
  ) {
    try {
      setError("");

      const response = await fetch(
        "/api/admin/delivery-partners",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            status: nextStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      await loadMembers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update status",
      );
    }
  }

  async function removeMember(id: string) {
    if (!window.confirm("Remove this delivery member?")) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        "/api/admin/delivery-partners",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to remove member");
      }

      await loadMembers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove delivery member",
      );
    }
  }

  return (
    <div>
      <PageHeader
        title="Delivery"
        subtitle="Manage delivery members and active deliveries."
      />

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted">
            Delivery members
          </p>
          <p className="mt-1 text-2xl font-bold">
            {members.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">
            Available
          </p>
          <p className="mt-1 text-2xl font-bold">
            {members.filter((member) => member.status === "available").length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">
            On delivery
          </p>
          <p className="mt-1 text-2xl font-bold">
            {members.filter((member) => member.status === "on-delivery").length}
          </p>
        </Card>
      </div>

      {/* Delivery members header */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            Delivery members
          </h2>
          <p className="mt-1 text-sm text-muted">
            View contact details and current delivery status.
          </p>
        </div>

        <Button
          onClick={() => setShowForm((value) => !value)}
        >
          {showForm ? "Cancel" : "+ Add member"}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add member form */}
      {showForm && (
        <Card className="mt-5 p-5">
          <h3 className="font-semibold">
            Add delivery member
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <Input
              placeholder="Phone number"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />

            <Input
              placeholder="Current area"
              value={area}
              onChange={(event) => setArea(event.target.value)}
            />

            <Select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as DeliveryStatus)
              }
            >
              <option value="available">Available</option>
              <option value="on-delivery">On delivery</option>
              <option value="offline">Offline</option>
            </Select>
          </div>

          <div className="mt-4">
            <Button
              onClick={addMember}
              disabled={saving}
            >
              {saving ? "Adding..." : "Add delivery member"}
            </Button>
          </div>
        </Card>
      )}

      {/* Members list */}
      <div className="mt-5 grid gap-4">
        {loading ? (
          <p className="py-6 text-center text-sm text-muted">
            Loading delivery members...
          </p>
        ) : members.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No delivery members found.
          </p>
        ) : (
          members.map((member) => (
            <Card key={member.id} className="p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold">
                      {member.name}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                        member.status,
                      )}`}
                    >
                      {statusLabel(member.status)}
                    </span>
                  </div>

                  <div className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-3 sm:gap-6">
                    <p>📞 {member.phone}</p>
                    <p>📍 {member.area}</p>
                    <p>📦 Order assignments are managed in Orders</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select
                    value={member.status}
                    onChange={(event) =>
                      updateStatus(
                        member.id,
                        event.target.value as DeliveryStatus,
                      )
                    }
                  >
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="on-delivery">On delivery</option>
                    <option value="offline">Offline</option>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => removeMember(member.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
