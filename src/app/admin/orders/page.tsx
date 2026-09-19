"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Check,
  Truck,
  Phone,
  UserRound,
} from "lucide-react";

import { orders } from "@/lib/data";
import {
  findBestDeliveryPartner,
  getDeliveryAssignments,
  getDeliveryMembers,
} from "@/lib/delivery-assignment";

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

function statusLabel(status: DeliveryStatus) {
  if (status === "assigned") {
    return "Assigned";
  }

  if (status === "out-on-delivery") {
    return "Out on delivery";
  }

  if (status === "available") {
    return "Available";
  }

  return "Offline";
}

function statusDot(status: DeliveryStatus) {
  if (status === "assigned") {
    return "bg-blue-500";
  }

  if (status === "out-on-delivery") {
    return "bg-amber-500";
  }

  if (status === "available") {
    return "bg-emerald-500";
  }

  return "bg-slate-400";
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

function normalizeMembers(
  value: unknown,
): DeliveryMember[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((member) => ({
    id: String(member?.id ?? ""),
    name: String(
      member?.name ?? "Delivery member",
    ),
    phone: String(
      member?.phone ?? "",
    ),
    status: normalizeStatus(
      member?.status,
    ),
    area: String(
      member?.area ?? "",
    ),
    assignedOrder:
      typeof member?.assignedOrder ===
      "string"
        ? member.assignedOrder
        : undefined,
  }));
}

function readAssignments(): Record<
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

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function readStages(): Record<
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

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function isDeliveryCompleted(
  orderId: string,
  stages: Record<
    string,
    DeliveryStage
  >,
) {
  return stages[orderId] === "delivered";
}

export default function AdminOrdersPage() {
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
      Record<
        string,
        DeliveryStage
      >
    >({});

  const [openOrderId, setOpenOrderId] =
    useState<string | null>(null);

  const dropdownRef =
    useRef<HTMLDivElement | null>(null);

  function loadDeliveryData() {
    try {
      const storedMembers =
        localStorage.getItem(
          MEMBERS_KEY,
        );

      const parsedMembers =
        storedMembers
          ? normalizeMembers(
              JSON.parse(
                storedMembers,
              ),
            )
          : [];

      const currentAssignments =
        readAssignments();

      const currentStages =
        readStages();

      setMembers(parsedMembers);
      setAssignments(
        currentAssignments,
      );
      setDeliveryStages(
        currentStages,
      );
    } catch {
      setMembers([]);
      setAssignments({});
      setDeliveryStages({});
    }
  }

useEffect(() => {
  const runAutoDispatch = () => {
    try {
      const currentMembers = getDeliveryMembers();
      const currentAssignments = getDeliveryAssignments();

      let nextMembers = [...currentMembers];
      let nextAssignments = {
        ...currentAssignments,
      };

      let changed = false;

      for (const order of orders) {
        const alreadyAssigned =
          nextAssignments[order.id];

        if (alreadyAssigned) continue;

        const needsDeliveryAssignment =
          order.status === "confirmed" ||
          order.status === "packed" ||
          order.status === "shipped" ||
          order.status === "out-for-delivery";

        if (!needsDeliveryAssignment) continue;

        const availableMembers = nextMembers.filter(
          (member) => member.status === "available",
        );

        if (availableMembers.length === 0) {
          continue;
        }

        const selectedMember =
          findBestDeliveryPartner(
            order,
            availableMembers,
            nextAssignments,
          );

        if (!selectedMember) continue;

        nextAssignments[order.id] = {
          memberId: selectedMember.id,
          memberName: selectedMember.name,
          memberPhone: selectedMember.phone,
        };

        nextMembers = nextMembers.map(
          (member) =>
            member.id === selectedMember.id
              ? {
                  ...member,
                  status: "assigned" as DeliveryStatus,
                  assignedOrder: order.id,
                }
              : member,
        );

        changed = true;
      }

      if (changed) {
        localStorage.setItem(
          MEMBERS_KEY,
          JSON.stringify(nextMembers),
        );

        localStorage.setItem(
          ASSIGNMENTS_KEY,
          JSON.stringify(nextAssignments),
        );
      }

      setMembers(nextMembers);
      setAssignments(nextAssignments);
    } catch {
      // Ignore invalid localStorage data.
    }
  };

  runAutoDispatch();

  window.addEventListener(
    "storage",
    runAutoDispatch,
  );

  window.addEventListener(
    "focus",
    runAutoDispatch,
  );

  return () => {
    window.removeEventListener(
      "storage",
      runAutoDispatch,
    );

    window.removeEventListener(
      "focus",
      runAutoDispatch,
    );
  };
}, []);

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpenOrderId(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  function saveDeliveryState(
    nextMembers: DeliveryMember[],
    nextAssignments: Record<
      string,
      DeliveryAssignment
    >,
  ) {
    setMembers(nextMembers);
    setAssignments(
      nextAssignments,
    );

    localStorage.setItem(
      MEMBERS_KEY,
      JSON.stringify(
        nextMembers,
      ),
    );

    localStorage.setItem(
      ASSIGNMENTS_KEY,
      JSON.stringify(
        nextAssignments,
      ),
    );

    window.dispatchEvent(
      new Event(
        DELIVERY_UPDATED_EVENT,
      ),
    );
  }

  function assignDeliveryMember(
    orderId: string,
    memberId: string,
  ) {
    const previousAssignment =
      assignments[orderId];

    /*
     * REMOVE ASSIGNMENT
     */
    if (!memberId) {
      const nextAssignments = {
        ...assignments,
      };

      delete nextAssignments[
        orderId
      ];

      let nextMembers =
        members.map(
          (
            member,
          ): DeliveryMember => {
            if (
              previousAssignment &&
              member.id ===
                previousAssignment.memberId
            ) {
              return {
                ...member,
                status:
                  member.status ===
                  "offline"
                    ? "offline"
                    : "available",
                assignedOrder:
                  undefined,
              };
            }

            return member;
          },
        );

      saveDeliveryState(
        nextMembers,
        nextAssignments,
      );

      setOpenOrderId(null);
      return;
    }

    const selectedMember =
      members.find(
        (member) =>
          member.id ===
          memberId,
      );

    if (!selectedMember) {
      return;
    }

    /*
     * Do not assign an offline partner.
     */
    if (
      selectedMember.status ===
      "offline"
    ) {
      return;
    }

    /*
     * Do not assign a partner who
     * already has another active order.
     */
    const alreadyAssigned =
      Object.entries(
        assignments,
      ).some(
        ([
          existingOrderId,
          assignment,
        ]) =>
          existingOrderId !==
            orderId &&
          assignment.memberId ===
            memberId &&
          !isDeliveryCompleted(
            existingOrderId,
            deliveryStages,
          ),
      );

    if (alreadyAssigned) {
      return;
    }

    /*
     * Release previous partner if
     * admin changes the assignment.
     */
    let nextMembers =
      members.map(
        (
          member,
        ): DeliveryMember => {
          if (
            previousAssignment &&
            member.id ===
              previousAssignment.memberId &&
            member.id !==
              memberId
          ) {
            return {
              ...member,
              status:
                member.status ===
                "offline"
                  ? "offline"
                  : "available",
              assignedOrder:
                undefined,
            };
          }

          return member;
        },
      );

    /*
     * Assign selected partner.
     *
     * IMPORTANT:
     * Assignment does NOT mean
     * out-for-delivery.
     *
     * Partner must press
     * "Out for delivery" later.
     */
    nextMembers =
      nextMembers.map(
        (
          member,
        ): DeliveryMember =>
          member.id ===
          memberId
            ? {
                ...member,
                status:
                  "assigned",
                assignedOrder:
                  orderId,
              }
            : member,
      );

    const nextAssignments = {
      ...assignments,
      [orderId]: {
        memberId:
          selectedMember.id,
        memberName:
          selectedMember.name,
        memberPhone:
          selectedMember.phone,
      },
    };

    const nextStages = {
      ...deliveryStages,
      [orderId]:
        deliveryStages[
          orderId
        ] ?? "assigned",
    };

    setDeliveryStages(
      nextStages,
    );

    localStorage.setItem(
      DELIVERY_STAGES_KEY,
      JSON.stringify(
        nextStages,
      ),
    );

    saveDeliveryState(
      nextMembers,
      nextAssignments,
    );

    setOpenOrderId(null);
  }

  const pendingOrders =
    orders.filter(
      (order) =>
        !isDeliveryCompleted(
          order.id,
          deliveryStages,
        ),
    ).length;

  const codOrders =
    orders.filter(
      (order) => {
        const payment =
          order.payment
            ?.toLowerCase() ??
          "";

        return (
          payment.includes(
            "cash",
          ) ||
          payment.includes(
            "cod",
          )
        );
      },
    ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Customer Orders
        </h1>

        <p className="mt-1 text-base text-muted">
          Manage grocery orders,
          payments and delivery
          assignments
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <p className="text-sm text-muted">
            Total orders
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {orders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <p className="text-sm text-muted">
            Pending orders
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {pendingOrders}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <p className="text-sm text-muted">
            COD orders
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {codOrders}
          </p>
        </div>
      </div>

      {/* Orders */}
      <div className="overflow-visible rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-50/80 text-left">
                <th className="min-w-[180px] px-5 py-4 text-sm font-semibold">
                  Order
                </th>

                <th className="min-w-[150px] px-5 py-4 text-sm font-semibold">
                  Customer
                </th>

                <th className="min-w-[145px] px-5 py-4 text-sm font-semibold">
                  Payment
                </th>

                <th className="min-w-[125px] px-5 py-4 text-sm font-semibold">
                  Status
                </th>

                <th className="min-w-[300px] px-5 py-4 text-sm font-semibold">
                  Delivery partner
                </th>

                <th className="min-w-[110px] px-5 py-4 text-right text-sm font-semibold">
                  Total
                </th>

                <th className="min-w-[90px] px-5 py-4 text-right text-sm font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map(
                (order) => {
                  const assignment =
                    assignments[
                      order.id
                    ];

                  const assignedMember =
                    assignment
                      ? members.find(
                          (
                            member,
                          ) =>
                            member.id ===
                            assignment.memberId,
                        )
                      : undefined;

                  const isOpen =
                    openOrderId ===
                    order.id;

                  return (
                    <tr
                      key={
                        order.id
                      }
                      className="border-b border-border last:border-b-0"
                    >
                      {/* Order */}
                      <td className="px-5 py-4 align-middle">
                        <p className="font-medium text-ink">
                          {
                            order.id
                          }
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4 align-middle">
                        <p className="text-sm text-muted">
                          Customer
                        </p>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4 align-middle">
                        <span className="inline-flex max-w-[125px] rounded-full bg-slate-100 px-3 py-1.5 text-sm leading-5 text-ink">
                          {
                            order.payment
                          }
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 align-middle">
                        <span className="inline-flex rounded-full bg-teal-50 px-3 py-1.5 text-sm text-teal-800">
                          {
                            deliveryStages[
                              order.id
                            ] ??
                              order.status
                          }
                        </span>
                      </td>

                      {/* Delivery partner */}
                      <td className="px-5 py-4 align-middle">
                        <div
                          className="relative"
                          ref={
                            isOpen
                              ? dropdownRef
                              : undefined
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenOrderId(
                                isOpen
                                  ? null
                                  : order.id,
                              )
                            }
                            className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left transition ${
                              isOpen
                                ? "border-teal-700 ring-2 ring-teal-100"
                                : "border-border hover:border-slate-400"
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                  assignment
                                    ? "bg-teal-50 text-teal-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {assignment ? (
                                  <Truck
                                    size={
                                      17
                                    }
                                  />
                                ) : (
                                  <UserRound
                                    size={
                                      17
                                    }
                                  />
                                )}
                              </div>

                              <div className="min-w-0">
                                {assignment ? (
                                  <>
                                    <p className="truncate text-sm font-medium text-ink">
                                      {
                                        assignment.memberName
                                      }
                                    </p>

                                    <div className="mt-0.5 flex items-center gap-2">
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                          assignedMember
                                            ? statusDot(
                                                assignedMember.status,
                                              )
                                            : "bg-blue-500"
                                        }`}
                                      />

                                      <span className="text-xs text-muted">
                                        {assignedMember
                                          ? statusLabel(
                                              assignedMember.status,
                                            )
                                          : "Assigned"}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-sm font-medium text-ink">
                                      Assign partner
                                    </p>

                                    <p className="text-xs text-muted">
                                      Choose delivery member
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>

                            <ChevronDown
                              size={
                                18
                              }
                              className={`ml-3 shrink-0 text-muted transition-transform ${
                                isOpen
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </button>

                          {/* Dropdown */}
                          {isOpen && (
                            <div className="absolute left-0 right-0 z-[100] mt-2 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
                              <div className="border-b border-border bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                  Delivery partner
                                </p>

                                <p className="mt-1 text-sm text-ink">
                                  Manually assign this order
                                </p>
                              </div>

                              {/* Remove */}
                              {assignment && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    assignDeliveryMember(
                                      order.id,
                                      "",
                                    )
                                  }
                                  className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
                                >
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
                                    ×
                                  </div>

                                  <div>
                                    <p className="font-medium">
                                      Remove assignment
                                    </p>

                                    <p className="text-xs text-red-400">
                                      Make this order unassigned
                                    </p>
                                  </div>
                                </button>
                              )}

                              <div className="max-h-[280px] overflow-y-auto p-2">
                                {members.length ===
                                0 ? (
                                  <div className="px-4 py-6 text-center">
                                    <Truck
                                      size={
                                        22
                                      }
                                      className="mx-auto text-muted"
                                    />

                                    <p className="mt-2 text-sm font-medium">
                                      No delivery members
                                    </p>

                                    <p className="mt-1 text-xs text-muted">
                                      Add delivery members from the Delivery page.
                                    </p>
                                  </div>
                                ) : (
                                  members.map(
                                    (
                                      member,
                                    ) => {
                                      const selected =
                                        assignment?.memberId ===
                                        member.id;

                                      const assignedElsewhere =
                                        Boolean(
                                          member.assignedOrder &&
                                            member.assignedOrder !==
                                              order.id,
                                        );

                                      const canSelect =
                                        selected ||
                                        (
                                          member.status ===
                                            "available" &&
                                          !assignedElsewhere
                                        );

                                      return (
                                        <button
                                          type="button"
                                          key={
                                            member.id
                                          }
                                          disabled={
                                            !canSelect
                                          }
                                          onClick={() =>
                                            assignDeliveryMember(
                                              order.id,
                                              member.id,
                                            )
                                          }
                                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                                            selected
                                              ? "bg-teal-50"
                                              : canSelect
                                                ? "hover:bg-slate-50"
                                                : "cursor-not-allowed opacity-50"
                                          }`}
                                        >
                                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                            <UserRound
                                              size={
                                                17
                                              }
                                            />
                                          </div>

                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                              <p className="truncate text-sm font-medium text-ink">
                                                {
                                                  member.name
                                                }
                                              </p>

                                              {selected && (
                                                <Check
                                                  size={
                                                    17
                                                  }
                                                  className="shrink-0 text-teal-700"
                                                />
                                              )}
                                            </div>

                                            <div className="mt-1 flex items-center gap-2">
                                              <Phone
                                                size={
                                                  12
                                                }
                                                className="shrink-0 text-muted"
                                              />

                                              <span className="text-xs text-muted">
                                                {
                                                  member.phone
                                                }
                                              </span>
                                            </div>

                                            <div className="mt-1.5 flex items-center gap-2">
                                              <span
                                                className={`h-1.5 w-1.5 rounded-full ${statusDot(
                                                  member.status,
                                                )}`}
                                              />

                                              <span className="text-xs text-muted">
                                                {statusLabel(
                                                  member.status,
                                                )}
                                              </span>

                                              {member.area && (
                                                <>
                                                  <span className="text-xs text-slate-300">
                                                    •
                                                  </span>

                                                  <span className="truncate text-xs text-muted">
                                                    {
                                                      member.area
                                                    }
                                                  </span>
                                                </>
                                              )}
                                            </div>

                                            {assignedElsewhere && (
                                              <p className="mt-1 text-xs text-amber-600">
                                                Currently assigned to{" "}
                                                {
                                                  member.assignedOrder
                                                }
                                              </p>
                                            )}

                                            {member.status ===
                                              "offline" && (
                                              <p className="mt-1 text-xs text-slate-400">
                                                Currently offline
                                              </p>
                                            )}

                                            {member.status ===
                                                "out-on-delivery" &&
                                              !assignedElsewhere && (
                                                <p className="mt-1 text-xs text-amber-600">
                                                  Currently out on delivery
                                                </p>
                                              )}
                                          </div>
                                        </button>
                                      );
                                    },
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {assignment && (
                          <div className="mt-2 flex items-center gap-2 px-1">
                            <Phone
                              size={
                                12
                              }
                              className="text-muted"
                            />

                            <span className="text-xs text-muted">
                              {
                                assignment.memberPhone
                              }
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 text-right align-middle">
                        <span className="whitespace-nowrap font-medium text-ink">
                          ₹
                          {order.total.toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </td>

                      {/* Track */}
                      <td className="px-5 py-4 text-right align-middle">
                        <Link
                          href={`/track/${order.id}`}
                          className="font-medium text-teal-700 hover:text-teal-900"
                        >
                          Track
                        </Link>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}