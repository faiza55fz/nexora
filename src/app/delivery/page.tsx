"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Home,
  MapPin,
  Package,
  Phone,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";

import { orders, products } from "@/lib/data";

type DeliveryStatus =
  | "available"
  | "assigned"
  | "out-on-delivery"
  | "offline";

type DeliveryMember = {
  id: string;
  name: string;
  phone: string;
  status: DeliveryStatus;
  area: string;
  assignedOrder?: string;
};

type DeliveryAssignment = {
  memberId: string;
  memberName: string;
  memberPhone: string;
};

type DeliveryStage =
  | "assigned"
  | "out-for-delivery"
  | "near-customer"
  | "delivered";

const MEMBERS_KEY = "nexora-delivery-members";
const ASSIGNMENTS_KEY = "nexora-order-delivery";
const DELIVERY_STAGES_KEY =
  "nexora-delivery-order-stages";

const DELIVERY_UPDATED_EVENT =
  "nexora-delivery-updated";

const DEMO_MEMBER_ID = "d1";

function stageLabel(stage: DeliveryStage) {
  switch (stage) {
    case "assigned":
      return "Assigned";

    case "out-for-delivery":
      return "Out for delivery";

    case "near-customer":
      return "Near customer";

    case "delivered":
      return "Delivered";
  }
}

function normalizeStatus(
  status: unknown,
): DeliveryStatus {
  if (status === "assigned") {
    return "assigned";
  }

  if (
    status === "out-on-delivery" ||
    status === "on-delivery"
  ) {
    return "out-on-delivery";
  }

  if (status === "offline") {
    return "offline";
  }

  return "available";
}

function getSavedMembers(): DeliveryMember[] {
  try {
    const saved =
      localStorage.getItem(MEMBERS_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((member) => ({
      id: String(member?.id ?? ""),
      name: String(
        member?.name ?? "Delivery member",
      ),
      phone: String(member?.phone ?? ""),
      status: normalizeStatus(
        member?.status,
      ),
      area: String(member?.area ?? ""),
      assignedOrder:
        typeof member?.assignedOrder ===
        "string"
          ? member.assignedOrder
          : undefined,
    }));
  } catch {
    return [];
  }
}

function getAssignments(): Record<
  string,
  DeliveryAssignment
> {
  try {
    const saved =
      localStorage.getItem(
        ASSIGNMENTS_KEY,
      );

    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved);

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      return parsed;
    }

    return {};
  } catch {
    return {};
  }
}

function getStages(): Record<
  string,
  DeliveryStage
> {
  try {
    const saved =
      localStorage.getItem(
        DELIVERY_STAGES_KEY,
      );

    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved);

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      return parsed;
    }

    return {};
  } catch {
    return {};
  }
}

function getOrderItemName(
  productId: string,
) {
  return (
    products.find(
      (product) =>
        product.id === productId,
    )?.name ?? "Product"
  );
}

export default function DeliveryPage() {
  const [members, setMembers] =
    useState<DeliveryMember[]>([]);

  const [assignments, setAssignments] =
    useState<
      Record<
        string,
        DeliveryAssignment
      >
    >({});

  const [deliveryStages, setDeliveryStages] =
    useState<
      Record<string, DeliveryStage>
    >({});

  const [selectedMemberId, setSelectedMemberId] =
    useState(DEMO_MEMBER_ID);

  const [isUpdating, setIsUpdating] =
    useState(false);

  /*
   * Read the complete shared delivery state.
   */
  function loadDeliveryState() {
    const savedMembers =
      getSavedMembers();

    const savedAssignments =
      getAssignments();

    const savedStages =
      getStages();

    /*
     * Keep the member data exactly as Admin
     * created it.
     *
     * We only use the assignment/stage data
     * to determine what this portal should show.
     */
    setMembers(savedMembers);
    setAssignments(savedAssignments);
    setDeliveryStages(savedStages);

    /*
     * If the currently selected partner no
     * longer exists, select the first partner.
     */
    if (
      savedMembers.length > 0 &&
      !savedMembers.some(
        (member) =>
          member.id === selectedMemberId,
      )
    ) {
      setSelectedMemberId(
        savedMembers[0].id,
      );
    }
  }

  useEffect(() => {
    loadDeliveryState();

    const handleUpdate = () => {
      loadDeliveryState();
    };

    window.addEventListener(
      "storage",
      handleUpdate,
    );

    window.addEventListener(
      "focus",
      handleUpdate,
    );

    window.addEventListener(
      DELIVERY_UPDATED_EVENT,
      handleUpdate,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleUpdate,
      );

      window.removeEventListener(
        "focus",
        handleUpdate,
      );

      window.removeEventListener(
        DELIVERY_UPDATED_EVENT,
        handleUpdate,
      );
    };
  }, [selectedMemberId]);

  const currentMember = useMemo(() => {
    return (
      members.find(
        (member) =>
          member.id === selectedMemberId,
      ) ?? null
    );
  }, [
    members,
    selectedMemberId,
  ]);

  /*
   * Find the order assigned to this partner.
   *
   * Priority:
   * 1. Assignment map
   * 2. member.assignedOrder
   *
   * This fixes the situation where Admin has
   * assigned the order but the partner portal
   * was showing "You're all caught up".
   */
  const assignedOrderId = useMemo(() => {
    if (!currentMember) {
      return undefined;
    }

    const assignmentEntry =
      Object.entries(assignments).find(
        ([orderId, assignment]) =>
          assignment?.memberId ===
            currentMember.id &&
          deliveryStages[orderId] !==
            "delivered",
      );

    if (assignmentEntry) {
      return assignmentEntry[0];
    }

    if (
      currentMember.assignedOrder &&
      orders.some(
        (order) =>
          order.id ===
          currentMember.assignedOrder,
      )
    ) {
      const stage =
        deliveryStages[
          currentMember.assignedOrder
        ];

      if (stage !== "delivered") {
        return currentMember.assignedOrder;
      }
    }

    return undefined;
  }, [
    currentMember,
    assignments,
    deliveryStages,
  ]);

  const assignedOrder =
    assignedOrderId
      ? orders.find(
          (order) =>
            order.id ===
            assignedOrderId,
        )
      : null;

  const currentStage: DeliveryStage =
    assignedOrderId
      ? deliveryStages[
          assignedOrderId
        ] ?? "assigned"
      : "assigned";

  /*
   * Save the shared delivery state.
   *
   * Both Admin and Customer pages can listen
   * for this same event and refresh.
   */
  function saveDeliveryState(
    nextMembers: DeliveryMember[],
    nextAssignments: Record<
      string,
      DeliveryAssignment
    >,
    nextStages: Record<
      string,
      DeliveryStage
    >,
  ) {
    localStorage.setItem(
      MEMBERS_KEY,
      JSON.stringify(nextMembers),
    );

    localStorage.setItem(
      ASSIGNMENTS_KEY,
      JSON.stringify(
        nextAssignments,
      ),
    );

    localStorage.setItem(
      DELIVERY_STAGES_KEY,
      JSON.stringify(
        nextStages,
      ),
    );

    setMembers(nextMembers);
    setAssignments(
      nextAssignments,
    );
    setDeliveryStages(
      nextStages,
    );

    window.dispatchEvent(
      new Event(
        DELIVERY_UPDATED_EVENT,
      ),
    );
  }

  /*
   * Delivery partner controls the delivery
   * progression.
   *
   * Admin does NOT need to click
   * "Out for delivery".
   */
  function updateDeliveryStage(
    nextStage: DeliveryStage,
  ) {
    if (
      !currentMember ||
      !assignedOrder
    ) {
      return;
    }

    setIsUpdating(true);

    try {
      const orderId =
        assignedOrder.id;

      const nextStages = {
        ...deliveryStages,
        [orderId]: nextStage,
      };

      let nextMembers =
        [...members];

      let nextAssignments = {
        ...assignments,
      };

      /*
       * Partner physically picked up the order
       * and is now going out for delivery.
       */
      if (
        nextStage ===
        "out-for-delivery"
      ) {
        nextMembers =
          nextMembers.map(
            (member) => {
              if (
                member.id !==
                currentMember.id
              ) {
                return member;
              }

              return {
                ...member,
                status:
                  "out-on-delivery",
                assignedOrder:
                  orderId,
              };
            },
          );
      }

      /*
       * Delivery completed.
       *
       * Remove assignment and immediately make
       * the partner available for another order.
       */
      if (
        nextStage ===
        "delivered"
      ) {
        delete nextAssignments[
          orderId
        ];

        nextMembers =
          nextMembers.map(
            (member) => {
              if (
                member.id !==
                currentMember.id
              ) {
                return member;
              }

              return {
                ...member,
                status:
                  "available",
                assignedOrder:
                  undefined,
              };
            },
          );
      }

      saveDeliveryState(
        nextMembers,
        nextAssignments,
        nextStages,
      );
    } finally {
      setIsUpdating(false);
    }
  }

  const statusText =
    currentMember?.status ===
    "out-on-delivery"
      ? "Out on delivery"
      : currentMember?.status ===
          "assigned"
        ? "Assigned"
        : currentMember?.status ===
            "offline"
          ? "Offline"
          : "Available";

  const statusClass =
    currentMember?.status ===
    "out-on-delivery"
      ? "bg-amber-50 text-amber-700"
      : currentMember?.status ===
          "assigned"
        ? "bg-blue-50 text-blue-700"
        : currentMember?.status ===
            "offline"
          ? "bg-slate-100 text-slate-600"
          : "bg-emerald-50 text-emerald-700";

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white">
              <Truck size={21} />
            </div>

            <div>
              <p className="text-xl font-semibold tracking-tight text-ink">
                NEXORA
              </p>

              <p className="text-xs text-muted">
                Delivery Partner
              </p>
            </div>
          </div>

          {members.length > 1 && (
            <select
              value={
                selectedMemberId
              }
              onChange={(event) =>
                setSelectedMemberId(
                  event.target.value,
                )
              }
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-teal-700"
            >
              {members.map(
                (member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >
                    {member.name}
                  </option>
                ),
              )}
            </select>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        {currentMember ? (
          <>
            {/* Partner status */}
            <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <UserRound size={25} />
                  </div>

                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-ink">
                      {currentMember.name}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          currentMember.status ===
                          "out-on-delivery"
                            ? "bg-amber-500"
                            : currentMember.status ===
                                "assigned"
                              ? "bg-blue-500"
                              : currentMember.status ===
                                  "offline"
                                ? "bg-slate-400"
                                : "bg-emerald-500"
                        }`}
                      />

                      <span className="text-sm text-muted">
                        {statusText}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-medium ${statusClass}`}
                >
                  {statusText}
                </span>
              </div>
            </section>

            {/* Active delivery */}
            {assignedOrder ? (
              <section className="space-y-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-teal-700">
                      Active delivery
                    </p>

                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                      Order #
                      {assignedOrder.id}
                    </h1>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">
                    <Clock3 size={15} />
                    {stageLabel(
                      currentStage,
                    )}
                  </span>
                </div>

                {/* Customer */}
                <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <UserRound size={19} />
                    </div>

                    <div>
                      <p className="text-sm text-muted">
                        Customer
                      </p>

                      <p className="font-semibold text-ink">
                        Customer
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <MapPin
                          size={18}
                          className="mt-0.5 shrink-0 text-teal-700"
                        />

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted">
                            Delivery address
                          </p>

                          <p className="mt-1 text-sm leading-6 text-ink">
                            {assignedOrder.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <Phone
                          size={18}
                          className="mt-0.5 shrink-0 text-teal-700"
                        />

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted">
                            Customer contact
                          </p>

                          <p className="mt-1 text-sm text-muted">
                            Customer phone will
                            be connected when
                            customer contact data
                            is added to the order.
                          </p>

                          <button
                            type="button"
                            disabled
                            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-slate-400"
                          >
                            <Phone size={13} />
                            Call customer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
                  <div className="flex h-[300px] items-center justify-center bg-slate-100">
                    <div className="text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm">
                        <MapPin size={27} />
                      </div>

                      <p className="mt-4 font-semibold text-ink">
                        Delivery map
                      </p>

                      <p className="mt-1 max-w-sm text-sm text-muted">
                        Live GPS tracking will be
                        connected after the core
                        delivery workflow is stable.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order details */}
                <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Package size={19} />
                    </div>

                    <div>
                      <p className="text-sm text-muted">
                        Order details
                      </p>

                      <p className="font-semibold text-ink">
                        {assignedOrder.items.length}{" "}
                        item
                        {assignedOrder.items.length !==
                        1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 divide-y divide-border">
                    {assignedOrder.items.map(
                      (item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-ink">
                              {getOrderItemName(
                                item.productId,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              Qty: {item.qty}
                            </p>
                          </div>

                          <p className="text-sm font-medium text-ink">
                            ₹
                            {(
                              item.price *
                              item.qty
                            ).toLocaleString(
                              "en-IN",
                            )}
                          </p>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                    <div>
                      <p className="text-sm text-muted">
                        Payment
                      </p>

                      <p className="mt-1 text-sm font-medium text-ink">
                        {assignedOrder.payment}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted">
                        Total
                      </p>

                      <p className="mt-1 text-xl font-semibold text-ink">
                        ₹
                        {assignedOrder.total.toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery actions */}
                <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                  {currentStage ===
                  "assigned" ? (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        updateDeliveryStage(
                          "out-for-delivery",
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Truck size={18} />

                      {isUpdating
                        ? "Updating..."
                        : "Out for delivery"}
                    </button>
                  ) : currentStage ===
                    "out-for-delivery" ? (
                    <div>
                      <div className="rounded-2xl bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                          <Truck
                            size={19}
                            className="mt-0.5 text-amber-700"
                          />

                          <div>
                            <p className="font-semibold text-amber-900">
                              You're out for
                              delivery
                            </p>

                            <p className="mt-1 text-sm leading-5 text-amber-700">
                              The order is now
                              marked as out for
                              delivery.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-400"
                      >
                        <MapPin size={18} />
                        Near customer — GPS
                        detection coming next
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          updateDeliveryStage(
                            "delivered",
                          )
                        }
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2
                          size={18}
                        />

                        {isUpdating
                          ? "Updating..."
                          : "Mark delivered"}
                      </button>
                    </div>
                  ) : currentStage ===
                    "near-customer" ? (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        updateDeliveryStage(
                          "delivered",
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 size={18} />

                      {isUpdating
                        ? "Updating..."
                        : "Mark delivered"}
                    </button>
                  ) : (
                    <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                      <CheckCircle2
                        size={24}
                        className="mx-auto text-emerald-600"
                      />

                      <p className="mt-2 font-semibold text-emerald-800">
                        Delivery completed
                      </p>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section className="rounded-3xl border border-border bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={30} />
                </div>

                <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
                  You're all caught up!
                </h1>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                  No active deliveries at the
                  moment. New orders will be
                  assigned automatically when
                  you become eligible.
                </p>
              </section>
            )}
          </>
        ) : (
          <section className="rounded-3xl border border-border bg-white p-10 text-center shadow-sm">
            <Truck
              size={30}
              className="mx-auto text-muted"
            />

            <h1 className="mt-3 text-xl font-semibold text-ink">
              No delivery partner found
            </h1>

            <p className="mt-1 text-sm text-muted">
              Add a delivery member from the
              Admin Delivery page.
            </p>
          </section>
        )}
      </main>

      {/* Delivery partner navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          <button
            type="button"
            className="flex flex-col items-center gap-1 px-3 py-3 text-teal-700"
          >
            <Home size={20} />
            <span className="text-xs font-medium">
              Home
            </span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center gap-1 px-3 py-3 text-muted"
          >
            <Package size={20} />
            <span className="text-xs font-medium">
              My Deliveries
            </span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center gap-1 px-3 py-3 text-muted"
          >
            <Wallet size={20} />
            <span className="text-xs font-medium">
              Earnings
            </span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center gap-1 px-3 py-3 text-muted"
          >
            <UserRound size={20} />
            <span className="text-xs font-medium">
              Profile
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}