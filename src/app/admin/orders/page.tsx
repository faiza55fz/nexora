"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Check,
  Truck,
  Phone,
  UserRound,
  X,
  PackageCheck,
  CircleCheck,
} from "lucide-react";



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

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  payment: string;
  status: string;
  createdAt: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
};


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

function orderStatusLabel(status: string) {
  if (status === "placed") {
    return "Placed";
  }

  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "packed") {
    return "Packed";
  }

  if (status === "out-for-delivery") {
    return "Out for delivery";
  }

  if (status === "delivered") {
    return "Delivered";
  }

  return status;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] =
    useState<AdminOrder[]>([]);

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

  const [selectedOrderId, setSelectedOrderId] =
    useState<string | null>(null);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [statusError, setStatusError] =
    useState("");


  const dropdownRef =
    useRef<HTMLDivElement | null>(null);

  const selectedOrder =
    orders.find(
      (order) =>
        order.id === selectedOrderId,
    ) ?? null;

  useEffect(() => {
  async function loadOrders() {
    try {
      const [ordersResponse, partnersResponse] =
        await Promise.all([
          fetch("/api/orders", {
            cache: "no-store",
          }),
          fetch("/api/admin/delivery-partners", {
            cache: "no-store",
          }),
        ]);

      const data = await ordersResponse.json();
      const partnersData = await partnersResponse.json();

      if (!ordersResponse.ok) {
        throw new Error(
          data?.error || "Unable to fetch orders.",
        );
      }

      if (
        !partnersResponse.ok ||
        !partnersData?.success
      ) {
        throw new Error(
          partnersData?.error ||
            "Unable to fetch delivery partners.",
        );
      }

      const mappedMembers: DeliveryMember[] =
        (partnersData.partners ?? []).map(
          (partner: any) => ({
            id: partner.id,
            name: partner.name || "Delivery member",
            phone: partner.phone || "",
            status: normalizeStatus(partner.status),
            area: partner.area || "",
          }),
        );

      const mappedAssignments: Record<
        string,
        DeliveryAssignment
      > = {};

      const mappedOrders: AdminOrder[] =
        (data.orders ?? []).map((order: any) => {
          const partner = Array.isArray(
            order.delivery_partner,
          )
            ? order.delivery_partner[0]
            : order.delivery_partner;

          if (order.delivery_partner_id) {
            mappedAssignments[order.id] = {
              memberId: order.delivery_partner_id,
              memberName:
                partner?.name ||
                mappedMembers.find(
                  (member) =>
                    member.id ===
                    order.delivery_partner_id,
                )?.name ||
                "Delivery member",
              memberPhone:
                partner?.phone ||
                mappedMembers.find(
                  (member) =>
                    member.id ===
                    order.delivery_partner_id,
                )?.phone ||
                "",
            };
          }

          return {
            id: order.id,
            orderNumber: order.order_number,
            customerName:
              order.customer_name || "Customer",
            customerEmail: order.customer_email || "",
            customerPhone: order.customer_phone || "",
            address: order.address || "",
            subtotal: Number(order.subtotal) || 0,
            deliveryFee: Number(order.delivery_fee) || 0,
            total: Number(order.total) || 0,
            payment: String(
              order.payment_method ?? "COD",
            ).toUpperCase(),
            status: order.status ?? "placed",
            createdAt: order.created_at,
            deliveryPartnerId:
              order.delivery_partner_id || null,
            items: Array.isArray(order.order_items)
              ? order.order_items.map((item: any) => ({
                  id: item.id,
                  productId: item.product_id,
                  productName:
                    item.product_name || "Product",
                  quantity: Number(item.quantity) || 0,
                  price: Number(item.price) || 0,
                }))
              : [],
          };
        });

      setOrders(mappedOrders);
      setMembers(mappedMembers);
      setAssignments(mappedAssignments);
    } catch (error) {
      console.error("Failed to load admin orders:", error);
      setOrders([]);
      setMembers([]);
      setAssignments({});
    }
  }

  loadOrders();
}, []);
async function loadDeliveryData() {
  try {
    const response = await fetch(
      "/api/admin/delivery-partners",
      { cache: "no-store" },
    );

    const data = await response.json();

    if (!response.ok || !data?.success) {
      throw new Error("Unable to load delivery partners.");
    }

    const parsedMembers = normalizeMembers(
      data.partners,
    );

    setMembers(parsedMembers);
    setDeliveryStages(readStages());
  } catch (error) {
    console.error("Failed to load delivery partners:", error);
  }
}

  useEffect(() => {
    loadDeliveryData();

    const handleDeliveryUpdate =
      () => {
        loadDeliveryData();
      };

    window.addEventListener(
      "storage",
      handleDeliveryUpdate,
    );

    window.addEventListener(
      DELIVERY_UPDATED_EVENT,
      handleDeliveryUpdate,
    );

    window.addEventListener(
      "focus",
      handleDeliveryUpdate,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleDeliveryUpdate,
      );

      window.removeEventListener(
        DELIVERY_UPDATED_EVENT,
        handleDeliveryUpdate,
      );

      window.removeEventListener(
        "focus",
        handleDeliveryUpdate,
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

  async function updateOrderStatus(
    orderId: string,
    nextStatus:
      | "confirmed"
      | "packed"
      | "cancelled",
  ) {
    setUpdatingStatus(true);
    setStatusError("");

    try {
      const response =
        await fetch("/api/orders", {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            orderId,
            status: nextStatus,
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to update order status.",
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map(
          (order) =>
            order.id === orderId
              ? {
                  ...order,
                  status:
                    data.order?.status ??
                    nextStatus,
                }
              : order,
        ),
      );
    } catch (error) {
      console.error(
        "Failed to update order status:",
        error,
      );

      setStatusError(
        error instanceof Error
          ? error.message
          : "Unable to update order status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  }
  

async function assignDeliveryMember(
  orderId: string,
  memberId: string,
) {
  setStatusError("");
  setUpdatingStatus(true);

  try {
    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        deliveryPartnerId: memberId || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error || "Unable to update delivery assignment.",
      );
    }

    const selectedMember = members.find(
      (member) => member.id === memberId,
    );

    setAssignments((current) => {
      const next = { ...current };

      if (!memberId) {
        delete next[orderId];
      } else if (selectedMember) {
        next[orderId] = {
          memberId: selectedMember.id,
          memberName: selectedMember.name,
          memberPhone: selectedMember.phone,
        };
      }

      return next;
    });

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              deliveryPartnerId: memberId || null,
            }
          : order,
      ),
    );

    await loadDeliveryData();

    setOpenOrderId(null);
  } catch (error) {
    console.error("Delivery assignment failed:", error);

    setStatusError(
      error instanceof Error
        ? error.message
        : "Unable to update delivery assignment.",
    );
  } finally {
    setUpdatingStatus(false);
  }
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
        <div className="rounded-2xl border border-border bg-white dark:bg-surface p-6 shadow-sm">
          <p className="text-sm text-muted">
            Total orders
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {orders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white dark:bg-surface p-6 shadow-sm">
          <p className="text-sm text-muted">
            Pending orders
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {pendingOrders}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white dark:bg-surface p-6 shadow-sm">
          <p className="text-sm text-muted">
            COD orders
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {codOrders}
          </p>
        </div>
      </div>

      {/* Orders */}
      <div className="overflow-visible rounded-2xl border border-border bg-white dark:bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-50/80 dark:bg-bg text-left text-ink">
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
                      className="border-b border-border last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-brand-soft/30"
                    >
                      {/* Order */}
                      <td className="px-5 py-4 align-middle">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderId(
                              order.id,
                            );
                            setStatusError("");
                          }}
                          className="text-left"
                        >
                          <p className="font-medium text-teal-700 hover:text-teal-900 hover:underline">
                            {
                              order.orderNumber
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {
                              order.items.length
                            }{" "}
                            item
                            {order.items.length ===
                            1
                              ? ""
                              : "s"}
                          </p>
                        </button>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4 align-middle">
                        <p className="text-sm font-medium text-ink">
                          {
                            order.customerName
                          }
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          {
                            order.customerPhone
                          }
                        </p>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4 align-middle">
                        <span className="inline-flex max-w-[125px] rounded-full bg-slate-100 dark:bg-bg px-3 py-1.5 text-sm leading-5 text-ink">
                          {
                            order.payment
                          }
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 align-middle">
                        <span className="inline-flex rounded-full bg-teal-50 px-3 py-1.5 text-sm text-teal-800">
                          {orderStatusLabel(
                            order.status,
                          )}
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
                            className={`"flex w-full items-center justify-between rounded-xl border border-border bg-white dark:bg-bg px-4 py-3 text-left text-ink transition <${
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
                            <div className="absolute left-0 right-0 z-[100] mt-2 overflow-hidden rounded-2xl border border-border bg-white dark:bg-surface text-ink shadow-2xl">
                              <div className="border-b border-border bg-slate-50 dark:bg-bg px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                  Delivery partner
                                </p>

                                <p className="mt-1 text-sm text-ink">
                                  Manually assign this order
                                </p>
                              </div>

                              {assignment && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    assignDeliveryMember(
                                      order.id,
                                      "",
                                    )
                                  }
                                  className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-50/50"
                                >
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 dark:bg-red-50/50">
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

                                      const assignedOrderCount =
  Object.entries(assignments).filter(
    ([assignedOrderId, assignment]) =>
      assignedOrderId !== order.id &&
      assignment.memberId === member.id &&
      !isDeliveryCompleted(
        assignedOrderId,
        deliveryStages,
      ),
  ).length;

const assignedElsewhere =
  assignedOrderCount > 0;

const canSelect =
  selected ||
  member.status !== "offline";

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
                                              ? "bg-teal-50 dark:bg-brand-soft"
                                              : canSelect
                                                ? "hover:bg-slate-50  dark:hover:bg-brand-soft/50"
                                                : "cursor-not-allowed opacity-50"
                                          }`}
                                        >
                                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-bg text-slate-600 dark:text-ink">
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
                                                Currently handling {assignedOrderCount} other order
{assignedOrderCount === 1 ? "" : "s"}
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
                                              (
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

      {/* Order details modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedOrderId(null);
              setStatusError("");
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Customer order
                </p>

                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                  {
                    selectedOrder.orderNumber
                  }
                </h2>

                <p className="mt-1 text-sm text-muted">
                  {new Date(
                    selectedOrder.createdAt,
                  ).toLocaleString(
                    "en-IN",
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedOrderId(
                    null,
                  );
                  setStatusError("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Status progression */}
              <div>
                <p className="text-sm font-semibold text-ink">
                  Order status
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div
                    className={`rounded-2xl border p-4 ${
                      selectedOrder.status ===
                        "placed" ||
                      selectedOrder.status ===
                        "confirmed" ||
                      selectedOrder.status ===
                        "packed"
                        ? "border-teal-200 bg-teal-50"
                        : "border-border bg-slate-50"
                    }`}
                  >
                    <CircleCheck
                      size={20}
                      className={
                        selectedOrder.status ===
                          "placed" ||
                        selectedOrder.status ===
                          "confirmed" ||
                        selectedOrder.status ===
                          "packed"
                          ? "text-teal-700"
                          : "text-slate-400"
                      }
                    />

                    <p className="mt-2 text-sm font-medium">
                      Placed
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl border p-4 ${
                      selectedOrder.status ===
                          "confirmed" ||
                        selectedOrder.status ===
                          "packed"
                        ? "border-teal-200 bg-teal-50"
                        : "border-border bg-slate-50"
                    }`}
                  >
                    <CircleCheck
                      size={20}
                      className={
                        selectedOrder.status ===
                            "confirmed" ||
                          selectedOrder.status ===
                            "packed"
                          ? "text-teal-700"
                          : "text-slate-400"
                      }
                    />

                    <p className="mt-2 text-sm font-medium">
                      Confirmed
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl border p-4 ${
                      selectedOrder.status ===
                        "packed"
                        ? "border-teal-200 bg-teal-50"
                        : "border-border bg-slate-50"
                    }`}
                  >
                    <PackageCheck
                      size={20}
                      className={
                        selectedOrder.status ===
                        "packed"
                          ? "text-teal-700"
                          : "text-slate-400"
                      }
                    />

                    <p className="mt-2 text-sm font-medium">
                      Packed
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-sm text-muted">
                    Current status
                  </span>

                  <span className="rounded-full bg-teal-100 px-3 py-1.5 text-sm font-medium text-teal-800">
                    {orderStatusLabel(
                      selectedOrder.status,
                    )}
                  </span>
                </div>
              </div>

              {/* Customer */}
              <div className="rounded-2xl border border-border p-5">
                <p className="text-sm font-semibold text-ink">
                  Customer details
                </p>

              

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted">
                      Name
                    </p>

                    <p className="mt-1 text-sm font-medium text-ink">
  {selectedOrder.customerName}
</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted">
                      Phone
                    </p>

                    <p className="mt-1 text-sm font-medium text-ink">
  {selectedOrder.customerPhone}
</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-medium text-ink">
                      {
                        selectedOrder.customerEmail
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted">
                      Payment
                    </p>

                    <p className="mt-1 text-sm font-medium text-ink">
                      {
                        selectedOrder.payment
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-muted">
                    Delivery address
                  </p>

                 <p className="mt-1 text-sm font-medium text-ink">
  {selectedOrder.address}
</p>
                </div>

               
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-ink">
                  Order items
                </p>

                <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                  {selectedOrder.items.map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={
                          item.id
                        }
                        className={`flex items-center justify-between gap-4 px-4 py-4 ${
                          index <
                          selectedOrder
                            .items
                            .length -
                            1
                            ? "border-b border-border"
                            : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">
                            {
                              item.productName
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {
                              item.quantity
                            }{" "}
                            × ₹
                            {item.price.toLocaleString(
                              "en-IN",
                            )}
                          </p>
                        </div>

                        <p className="whitespace-nowrap text-sm font-semibold text-ink">
                          ₹
                          {(
                            item.quantity *
                            item.price
                          ).toLocaleString(
                            "en-IN",
                          )}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Payment summary */}
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">
                    Subtotal
                  </span>

                  <span className="font-medium text-ink">
                    ₹
                    {selectedOrder.subtotal.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted">
                    Delivery
                  </span>

                  <span className="font-medium text-ink">
                    ₹
                    {selectedOrder.deliveryFee.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>

                <div className="mt-3 flex justify-between border-t border-border pt-3">
                  <span className="font-semibold text-ink">
                    Total
                  </span>

                  <span className="text-lg font-semibold text-ink">
                    ₹
                    {selectedOrder.total.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
              </div>

              {/* Status error */}
              {statusError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {statusError}
                </div>
              )}

              {/* Status action */}
              <div className="border-t border-border pt-5">
                {selectedOrder.status ===
                  "placed" && (
                  <button
                    type="button"
                    disabled={
                      updatingStatus
                    }
                    onClick={() =>
                      updateOrderStatus(
                        selectedOrder.id,
                        "confirmed",
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CircleCheck
                      size={18}
                    />

                    {updatingStatus
                      ? "Confirming order..."
                      : "Confirm order"}
                  </button>
                )}

                {selectedOrder.status ===
                  "confirmed" && (
                  <button
                    type="button"
                    disabled={
                      updatingStatus
                    }
                    onClick={() =>
                      updateOrderStatus(
                        selectedOrder.id,
                        "packed",
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PackageCheck
                      size={18}
                    />

                    {updatingStatus
                      ? "Marking as packed..."
                      : "Mark as packed"}
                  </button>
                )}

                {selectedOrder.status ===
                  "packed" && (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-700">
                    <PackageCheck
                      size={18}
                    />

                    Order packed
                  </div>
                )}

                {(selectedOrder.status ===
                  "placed" ||
                  selectedOrder.status ===
                    "confirmed") && (
                  <button
                    type="button"
                    disabled={
                      updatingStatus
                    }
                    onClick={() =>
                      updateOrderStatus(
                        selectedOrder.id,
                        "cancelled",
                      )
                    }
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X size={18} />

                    {updatingStatus
                      ? "Cancelling order..."
                      : "Cancel order"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}