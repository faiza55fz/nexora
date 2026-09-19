"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  MapPin,
  PackageCheck,
  Phone,
  Truck,
  UserRound,
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

function normalizeStage(
  value: unknown,
): DeliveryStage {
  if (
    value === "out-for-delivery" ||
    value === "near-customer" ||
    value === "delivered"
  ) {
    return value;
  }

  return "assigned";
}

function stageLabel(
  stage: DeliveryStage,
) {
  switch (stage) {
    case "assigned":
      return "Order assigned";

    case "out-for-delivery":
      return "Out for delivery";

    case "near-customer":
      return "Near customer";

    case "delivered":
      return "Delivered";
  }
}

function nextStage(
  stage: DeliveryStage,
): DeliveryStage | null {
  switch (stage) {
    case "assigned":
      return "out-for-delivery";

    case "out-for-delivery":
      return "near-customer";

    case "near-customer":
      return "delivered";

    case "delivered":
      return null;
  }
}

function nextActionLabel(
  stage: DeliveryStage,
) {
  switch (stage) {
    case "assigned":
      return "Out for delivery";

    case "out-for-delivery":
      return "Near customer";

    case "near-customer":
      return "Mark delivered";

    case "delivered":
      return "Delivered";
  }
}

function getProductName(
  productId: string,
) {
  const product = products.find(
    (item) => item.id === productId,
  );

  return product?.name ?? productId;
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

  const [stages, setStages] =
    useState<
      Record<string, DeliveryStage>
    >({});

  /*
   * For now this is a demo delivery portal.
   *
   * The selected partner represents the
   * currently logged-in delivery partner.
   */
  const [
    selectedMemberId,
    setSelectedMemberId,
  ] = useState<string>("");

  function loadDeliveryData() {
    try {
      const rawMembers =
        localStorage.getItem(
          MEMBERS_KEY,
        );

      const rawAssignments =
        localStorage.getItem(
          ASSIGNMENTS_KEY,
        );

      const rawStages =
        localStorage.getItem(
          DELIVERY_STAGES_KEY,
        );

      const parsedMembers =
        rawMembers
          ? normalizeMembers(
              JSON.parse(
                rawMembers,
              ),
            )
          : [];

      const parsedAssignments =
        rawAssignments
          ? JSON.parse(
              rawAssignments,
            )
          : {};

      const parsedStages =
        rawStages
          ? JSON.parse(
              rawStages,
            )
          : {};

      setMembers(parsedMembers);

      setAssignments(
        parsedAssignments &&
          typeof parsedAssignments ===
            "object"
          ? parsedAssignments
          : {},
      );

      const normalizedStages: Record<
        string,
        DeliveryStage
      > = {};

      if (
        parsedStages &&
        typeof parsedStages ===
          "object"
      ) {
        Object.entries(
          parsedStages,
        ).forEach(
          ([orderId, stage]) => {
            normalizedStages[
              orderId
            ] =
              normalizeStage(
                stage,
              );
          },
        );
      }

      setStages(
        normalizedStages,
      );

      /*
       * Keep the currently selected partner
       * if they still exist.
       *
       * Otherwise select the first partner.
       */
      if (
        parsedMembers.length > 0
      ) {
        const stillExists =
          parsedMembers.some(
            (member) =>
              member.id ===
              selectedMemberId,
          );

        if (!stillExists) {
          setSelectedMemberId(
            parsedMembers[0].id,
          );
        }
      } else {
        setSelectedMemberId("");
      }
    } catch {
      setMembers([]);
      setAssignments({});
      setStages({});
      setSelectedMemberId("");
    }
  }

  useEffect(() => {
    loadDeliveryData();

    const handleUpdate = () => {
      loadDeliveryData();
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

  const selectedMember =
    members.find(
      (member) =>
        member.id ===
        selectedMemberId,
    );

  /*
   * Only orders assigned to the currently
   * selected delivery partner appear here.
   */
  const assignedOrders =
    useMemo(() => {
      if (!selectedMember) {
        return [];
      }

      const orderIds =
        new Set<string>();

      Object.entries(
        assignments,
      ).forEach(
        ([orderId, assignment]) => {
          if (
            assignment.memberId ===
            selectedMember.id
          ) {
            orderIds.add(orderId);
          }
        },
      );

      /*
       * Also support the member-level
       * assignedOrder field.
       */
      if (
        selectedMember.assignedOrder
      ) {
        orderIds.add(
          selectedMember.assignedOrder,
        );
      }

      return Array.from(orderIds)
        .map((orderId) => {
          const order =
            orders.find(
              (item) =>
                item.id ===
                orderId,
            );

          if (!order) {
            return null;
          }

          const assignment =
            assignments[
              orderId
            ];

          if (!assignment) {
            return {
              order,
              assignment: {
                memberId:
                  selectedMember.id,
                memberName:
                  selectedMember.name,
                memberPhone:
                  selectedMember.phone,
              },
              stage:
                stages[orderId] ??
                "assigned",
            };
          }

          return {
            order,
            assignment,
            stage:
              stages[orderId] ??
              "assigned",
          };
        })
        .filter(
          (
            item,
          ): item is {
            order: (typeof orders)[number];
            assignment: DeliveryAssignment;
            stage: DeliveryStage;
          } =>
            item !== null,
        );
    }, [
      assignments,
      selectedMember,
      stages,
    ]);

  function updateDeliveryStage(
    orderId: string,
  ) {
    if (!selectedMember) {
      return;
    }

    const currentStage =
      stages[orderId] ??
      "assigned";

    const next =
      nextStage(
        currentStage,
      );

    if (!next) {
      return;
    }

    /*
     * Update shared order stage.
     */
    const nextStages = {
      ...stages,
      [orderId]: next,
    };

    setStages(
      nextStages,
    );

    localStorage.setItem(
      DELIVERY_STAGES_KEY,
      JSON.stringify(
        nextStages,
      ),
    );

    /*
     * OUT FOR DELIVERY
     *
     * Partner has physically picked up
     * the order and started delivery.
     */
    if (
      next ===
      "out-for-delivery"
    ) {
      const nextMembers =
        members.map(
          (member) =>
            member.id ===
            selectedMember.id
              ? {
                  ...member,
                  status:
                    "out-on-delivery" as DeliveryStatus,
                  assignedOrder:
                    orderId,
                }
              : member,
        );

      setMembers(
        nextMembers,
      );

      localStorage.setItem(
        MEMBERS_KEY,
        JSON.stringify(
          nextMembers,
        ),
      );
    }

    /*
     * NEAR CUSTOMER
     *
     * For now this is a manual action.
     * Later we can replace it with GPS/
     * geofencing.
     */
    if (
      next ===
      "near-customer"
    ) {
      const nextMembers =
        members.map(
          (member) =>
            member.id ===
            selectedMember.id
              ? {
                  ...member,
                  status:
                    "out-on-delivery" as DeliveryStatus,
                  assignedOrder:
                    orderId,
                }
              : member,
        );

      setMembers(
        nextMembers,
      );

      localStorage.setItem(
        MEMBERS_KEY,
        JSON.stringify(
          nextMembers,
        ),
      );
    }

    /*
     * DELIVERED
     *
     * Remove the assignment and make the
     * delivery partner available again.
     */
    if (
      next === "delivered"
    ) {
      const nextMembers =
        members.map(
          (member) =>
            member.id ===
            selectedMember.id
              ? {
                  ...member,
                  status:
                    "available" as DeliveryStatus,
                  assignedOrder:
                    undefined,
                }
              : member,
        );

      const nextAssignments = {
        ...assignments,
      };

      delete nextAssignments[
        orderId
      ];

      setMembers(
        nextMembers,
      );

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
    }

    /*
     * Tell Admin and Customer pages
     * to refresh.
     */
    window.dispatchEvent(
      new Event(
        DELIVERY_UPDATED_EVENT,
      ),
    );
  }

  const activeDeliveryCount =
    assignedOrders.filter(
      (item) =>
        item.stage !==
        "delivered",
    ).length;

  return (
    <div className="space-y-6">
      {/* Partner selector */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Truck size={22} />
            </div>

            <div>
              <p className="text-sm text-muted">
                Delivery partner
              </p>

              <p className="text-xl font-semibold text-ink">
                {selectedMember?.name ??
                  "Delivery Partner"}
              </p>
            </div>
          </div>

          <select
            value={
              selectedMemberId
            }
            onChange={(event) =>
              setSelectedMemberId(
                event.target.value,
              )
            }
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-teal-700 md:w-[320px]"
          >
            {members.length ===
            0 ? (
              <option value="">
                No delivery members
              </option>
            ) : (
              members.map(
                (member) => (
                  <option
                    key={
                      member.id
                    }
                    value={
                      member.id
                    }
                  >
                    {member.name} —{" "}
                    {statusLabelForMember(
                      member.status,
                    )}
                  </option>
                ),
              )
            )}
          </select>
        </div>
      </div>

      {/* Partner summary */}
      {selectedMember && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <UserRound size={18} />
              </div>

              <div>
                <p className="font-semibold text-ink">
                  {selectedMember.name}
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedMember.status ===
                      "available"
                        ? "bg-emerald-500"
                        : selectedMember.status ===
                            "out-on-delivery"
                          ? "bg-amber-500"
                          : selectedMember.status ===
                              "assigned"
                            ? "bg-blue-500"
                            : "bg-slate-400"
                    }`}
                  />

                  <span className="text-xs text-muted">
                    {statusLabelForMember(
                      selectedMember.status,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm text-muted">
              Active deliveries
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {activeDeliveryCount}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm text-muted">
              Partner contact
            </p>

            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-ink">
              <Phone size={15} />

              {selectedMember.phone}
            </div>
          </div>
        </div>
      )}

      {/* Assigned orders */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-ink">
            My deliveries
          </h2>

          <p className="mt-1 text-sm text-muted">
            Orders manually assigned to you
            by the admin appear here.
          </p>
        </div>

        {assignedOrders.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
            <PackageCheck
              size={30}
              className="mx-auto text-muted"
            />

            <p className="mt-3 font-medium text-ink">
              No active deliveries
            </p>

            <p className="mt-1 text-sm text-muted">
              Orders assigned to this
              delivery partner will appear
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedOrders.map(
              ({
                order,
                assignment,
                stage,
              }) => {
                const next =
                  nextStage(stage);

                return (
                  <div
                    key={
                      order.id
                    }
                    className="rounded-2xl border border-border bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        {/* Order header */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                            <PackageCheck
                              size={20}
                            />
                          </div>

                          <div>
                            <p className="font-semibold text-ink">
                              {order.id}
                            </p>

                            <p className="mt-1 text-sm text-muted">
                              {order.payment}{" "}
                              · ₹
                              {order.total.toLocaleString(
                                "en-IN",
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Pickup */}
                        <div className="mt-4 rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Pickup location
                          </p>

                          <div className="mt-2 flex items-start gap-2 text-sm font-medium text-ink">
                            <MapPin
                              size={17}
                              className="mt-0.5 shrink-0 text-teal-700"
                            />

                            <span>
                              Nexora Grocery
                              Warehouse
                            </span>
                          </div>
                        </div>

                        {/* Customer location */}
                        <div className="mt-3 rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Customer location
                          </p>

                          <div className="mt-2 flex items-start gap-2 text-sm font-medium text-ink">
                            <MapPin
                              size={17}
                              className="mt-0.5 shrink-0 text-teal-700"
                            />

                            <span>
                              {order.address ||
                                "Customer address unavailable"}
                            </span>
                          </div>
                        </div>

                        {/* Customer phone */}
                        <div className="mt-3 rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Customer contact
                          </p>

                          <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                            <Phone
                              size={16}
                              className="shrink-0"
                            />

                            <span>
                              Customer phone is not
                              stored in the current
                              order data.
                            </span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="mt-4 rounded-xl border border-border p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Order items
                          </p>

                          <div className="mt-3 space-y-2">
                            {order.items.map(
                              (item) => (
                                <div
                                  key={`${order.id}-${item.productId}`}
                                  className="flex items-center justify-between gap-3 text-sm"
                                >
                                  <span className="text-ink">
                                    {getProductName(
                                      item.productId,
                                    )}
                                  </span>

                                  <span className="shrink-0 text-muted">
                                    ×{" "}
                                    {
                                      item.qty
                                    }
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delivery actions */}
                      <div className="w-full lg:w-[300px]">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Delivery status
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex h-10 flex-1 items-center rounded-xl bg-slate-100 px-4 text-sm font-medium text-ink">
                            {stageLabel(
                              stage,
                            )}
                          </div>

                          {next && (
                            <ChevronRight
                              size={18}
                              className="shrink-0 text-muted"
                            />
                          )}
                        </div>

                        {next ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateDeliveryStage(
                                order.id,
                              )
                            }
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                          >
                            {stage ===
                              "assigned" && (
                              <Truck
                                size={17}
                              />
                            )}

                            {stage ===
                              "out-for-delivery" && (
                              <MapPin
                                size={17}
                              />
                            )}

                            {stage ===
                              "near-customer" && (
                              <CheckCircle2
                                size={17}
                              />
                            )}

                            {nextActionLabel(
                              stage,
                            )}
                          </button>
                        ) : (
                          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                            <CheckCircle2
                              size={17}
                            />

                            Delivery completed
                          </div>
                        )}

                        <p className="mt-2 text-center text-xs text-muted">
                          Assigned to{" "}
                          {
                            assignment.memberName
                          }
                        </p>
                      </div>
                    </div>

                    {/* Map */}
                    <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-slate-50">
                      <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
                        <MapPin
                          size={30}
                          className="text-teal-700"
                        />

                        <p className="mt-3 font-semibold text-ink">
                          Customer location
                        </p>

                        <p className="mt-1 max-w-md text-sm text-muted">
                          {order.address ||
                            "Customer address unavailable"}
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            const address =
                              order.address ||
                              "";

                            if (!address) {
                              return;
                            }

                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                address,
                              )}`,
                              "_blank",
                            );
                          }}
                          className="mt-4 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50"
                        >
                          Open in Maps
                        </button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-5 border-t border-border pt-5">
                      <div className="grid grid-cols-4 gap-1">
                        {(
                          [
                            "assigned",
                            "out-for-delivery",
                            "near-customer",
                            "delivered",
                          ] as DeliveryStage[]
                        ).map(
                          (
                            progressStage,
                          ) => {
                            const stageOrder: DeliveryStage[] =
                              [
                                "assigned",
                                "out-for-delivery",
                                "near-customer",
                                "delivered",
                              ];

                            const currentIndex =
                              stageOrder.indexOf(
                                stage,
                              );

                            const stageIndex =
                              stageOrder.indexOf(
                                progressStage,
                              );

                            const completed =
                              stageIndex <=
                              currentIndex;

                            return (
                              <div
                                key={
                                  progressStage
                                }
                                className={`h-1.5 rounded-full ${
                                  completed
                                    ? "bg-teal-600"
                                    : "bg-slate-200"
                                }`}
                              />
                            );
                          },
                        )}
                      </div>

                      <div className="mt-2 flex justify-between text-[10px] text-muted">
                        <span>
                          Assigned
                        </span>

                        <span>
                          Out
                        </span>

                        <span>
                          Near
                        </span>

                        <span>
                          Delivered
                        </span>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function statusLabelForMember(
  status: DeliveryStatus,
) {
  if (status === "available") {
    return "Available";
  }

  if (status === "assigned") {
    return "Assigned";
  }

  if (
    status === "out-on-delivery"
  ) {
    return "Out on delivery";
  }

  return "Offline";
}