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
  | "on-delivery"
  | "offline";

type DeliveryMember = {
  id: string;
  name: string;
  phone: string;
  status: DeliveryStatus;
  area: string;
  assignedOrder?: string;
};

const STORAGE_KEY = "nexora-delivery-members";

const defaultMembers: DeliveryMember[] = [
  {
    id: "d1",
    name: "Rahul Kumar",
    phone: "+91 98765 43210",
    status: "on-delivery",
    area: "Shivamogga",
    assignedOrder: "NXR-1024",
  },
  {
    id: "d2",
    name: "Amaan Khan",
    phone: "+91 91234 56789",
    status: "available",
    area: "Shivamogga",
  },
];

function statusLabel(status: DeliveryStatus) {
  if (status === "available") return "Available";
  if (status === "on-delivery") return "On delivery";
  return "Offline";
}

function statusClass(status: DeliveryStatus) {
  if (status === "available") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "on-delivery") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function LogisticsPage() {
  const [members, setMembers] =
    useState<DeliveryMember[]>(defaultMembers);

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] =
    useState<DeliveryStatus>("available");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setMembers(parsed);
      }
    } catch {
      // Keep default members if saved data is invalid.
    }
  }, []);

  function saveMembers(nextMembers: DeliveryMember[]) {
    setMembers(nextMembers);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextMembers),
    );
  }

  function addMember() {
    if (!name.trim() || !phone.trim() || !area.trim()) {
      return;
    }

    const newMember: DeliveryMember = {
      id: `d-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      area: area.trim(),
      status,
    };

    saveMembers([...members, newMember]);

    setName("");
    setPhone("");
    setArea("");
    setStatus("available");
    setShowForm(false);
  }

  function removeMember(id: string) {
    const nextMembers = members.filter(
      (member) => member.id !== id,
    );

    saveMembers(nextMembers);
  }

  function updateStatus(
    id: string,
    nextStatus: DeliveryStatus,
  ) {
    const nextMembers = members.map((member) =>
      member.id === id
        ? {
            ...member,
            status: nextStatus,
          }
        : member,
    );

    saveMembers(nextMembers);
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
            {
              members.filter(
                (member) =>
                  member.status === "available",
              ).length
            }
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-muted">
            On delivery
          </p>

          <p className="mt-1 text-2xl font-bold">
            {
              members.filter(
                (member) =>
                  member.status === "on-delivery",
              ).length
            }
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
              onChange={(event) =>
                setName(event.target.value)
              }
            />

            <Input
              placeholder="Phone number"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
            />

            <Input
              placeholder="Current area"
              value={area}
              onChange={(event) =>
                setArea(event.target.value)
              }
            />

            <Select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as DeliveryStatus,
                )
              }
            >
              <option value="available">
                Available
              </option>

              <option value="on-delivery">
                On delivery
              </option>

              <option value="offline">
                Offline
              </option>
            </Select>
          </div>

          <div className="mt-4">
            <Button onClick={addMember}>
              Add delivery member
            </Button>
          </div>
        </Card>
      )}

      {/* Members list */}
      <div className="mt-5 grid gap-4">
        {members.map((member) => (
          <Card
            key={member.id}
            className="p-5"
          >
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
                  <p>
                    📞 {member.phone}
                  </p>

                  <p>
                    📍 {member.area}
                  </p>

                  <p>
                    📦{" "}
                    {member.assignedOrder ??
                      "No assigned order"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Select
                  value={member.status}
                  onChange={(event) =>
                    updateStatus(
                      member.id,
                      event.target
                        .value as DeliveryStatus,
                    )
                  }
                >
                  <option value="available">
                    Available
                  </option>

                  <option value="on-delivery">
                    On delivery
                  </option>

                  <option value="offline">
                    Offline
                  </option>
                </Select>

                <Button
                  variant="outline"
                  onClick={() =>
                    removeMember(member.id)
                  }
                >
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}