"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Home,
  MapPin,
  Package,
  Phone,
  Search,
  Truck,
  UserRound,
  Wallet,
  X,
  Zap,
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

type ApiOrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
};

type ApiOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  address: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  order_items: ApiOrderItem[];
};

type DeliveryOrderItem = {
  productId: string;
  qty: number;
  price: number;
  productName: string;
};

type DeliveryOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: DeliveryOrderItem[];
  total: number;
  payment: string;
  status: string;
};

type DeliveryEarning = {
  id: string;
  orderId: string;
  orderNumber: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  earnedAt: string;
};

type DeliveryBlock = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  pickupLocation: string;
  deliveryArea: string;
  durationHours: number;
  expectedDeliveries: number;
  estimatedEarnings: {
    minimum: number;
    maximum: number;
  };
  incentives: number;
  status: "available" | "booked" | "starting-soon" | "completed" | "cancelled";
};

type BookedBlock = {
  blockId: string;
  partnerId: string;
  bookedAt: string;
  status: "booked" | "cancelled" | "completed";
};

type ActiveTab =
  | "home"
  | "blocks"
  | "schedule"
  | "earnings"
  | "profile";

const MEMBERS_KEY = "nexora-delivery-members";
const ASSIGNMENTS_KEY = "nexora-order-delivery";
const DELIVERY_STAGES_KEY = "nexora-delivery-order-stages";
const DELIVERY_UPDATED_EVENT = "nexora-delivery-updated";
const EARNINGS_KEY = "nexora-delivery-earnings";

const BLOCK_BOOKINGS_KEY = "nexora-delivery-block-bookings";
const DELIVERY_LOGIN_KEY = "nexora-delivery-session";

const DELIVERY_EARNING_AMOUNT = 40;

const DEMO_MEMBER_ID = "d1";

/*
 * Delivery block catalogue.
 *
 * These values are frontend-ready scheduling data.
 * They can later be replaced directly with the
 * backend/API response without changing the UI.
 */
const DELIVERY_BLOCKS: DeliveryBlock[] = [
  {
    id: "block-1",
    date: "2026-09-27",
    startTime: "10:00 AM",
    endTime: "2:00 PM",
    pickupLocation: "Nexora Hub — Shivamogga",
    deliveryArea: "Central Shivamogga",
    durationHours: 4,
    expectedDeliveries: 8,
    estimatedEarnings: {
      minimum: 600,
      maximum: 800,
    },
    incentives: 100,
    status: "available",
  },
  {
    id: "block-2",
    date: "2026-09-27",
    startTime: "5:00 PM",
    endTime: "9:00 PM",
    pickupLocation: "Nexora Hub — Shivamogga",
    deliveryArea: "Vinobanagar & Gopala",
    durationHours: 4,
    expectedDeliveries: 10,
    estimatedEarnings: {
      minimum: 700,
      maximum: 950,
    },
    incentives: 150,
    status: "available",
  },
  {
    id: "block-3",
    date: "2026-09-28",
    startTime: "9:00 AM",
    endTime: "1:00 PM",
    pickupLocation: "Nexora Hub — Shivamogga",
    deliveryArea: "Sagara Road",
    durationHours: 4,
    expectedDeliveries: 7,
    estimatedEarnings: {
      minimum: 550,
      maximum: 750,
    },
    incentives: 75,
    status: "available",
  },
  {
    id: "block-4",
    date: "2026-09-28",
    startTime: "4:00 PM",
    endTime: "8:00 PM",
    pickupLocation: "Nexora Hub — Shivamogga",
    deliveryArea: "BH Road & Surrounding Areas",
    durationHours: 4,
    expectedDeliveries: 9,
    estimatedEarnings: {
      minimum: 650,
      maximum: 900,
    },
    incentives: 125,
    status: "available",
  },
  {
    id: "block-5",
    date: "2026-09-29",
    startTime: "10:00 AM",
    endTime: "2:00 PM",
    pickupLocation: "Nexora Hub — Shivamogga",
    deliveryArea: "Navule & Surrounding Areas",
    durationHours: 4,
    expectedDeliveries: 8,
    estimatedEarnings: {
      minimum: 600,
      maximum: 820,
    },
    incentives: 100,
    status: "available",
  },
];

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

function normalizeStatus(status: unknown): DeliveryStatus {
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
    const saved = localStorage.getItem(MEMBERS_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((member) => ({
      id: String(member?.id ?? ""),
      name: String(member?.name ?? "Delivery member"),
      phone: String(member?.phone ?? ""),
      status: normalizeStatus(member?.status),
      area: String(member?.area ?? ""),
      assignedOrder:
        typeof member?.assignedOrder === "string"
          ? member.assignedOrder
          : undefined,
    }));
  } catch {
    return [];
  }
}

function getAssignments(): Record<string, DeliveryAssignment> {
  try {
    const saved = localStorage.getItem(ASSIGNMENTS_KEY);

    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved);

    if (parsed && typeof parsed === "object") {
      return parsed;
    }

    return {};
  } catch {
    return {};
  }
}

function getStages(): Record<string, DeliveryStage> {
  try {
    const saved = localStorage.getItem(DELIVERY_STAGES_KEY);

    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved);

    if (parsed && typeof parsed === "object") {
      return parsed;
    }

    return {};
  } catch {
    return {};
  }
}

function getSavedEarnings(): DeliveryEarning[] {
  try {
    const saved = localStorage.getItem(EARNINGS_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEarnings(earnings: DeliveryEarning[]) {
  localStorage.setItem(
    EARNINGS_KEY,
    JSON.stringify(earnings),
  );
}

function getSavedBookings(): BookedBlock[] {
  try {
    const saved = localStorage.getItem(BLOCK_BOOKINGS_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBookings(bookings: BookedBlock[]) {
  localStorage.setItem(
    BLOCK_BOOKINGS_KEY,
    JSON.stringify(bookings),
  );
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function isSameDay(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isSameWeek(date: Date, now: Date) {
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;

  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);

  return date >= start;
}

function isSameMonth(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function mapApiOrder(order: ApiOrder): DeliveryOrder {
  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerPhone: order.customer_phone ?? "",
    address: order.address,
    items: Array.isArray(order.order_items)
      ? order.order_items.map((item) => ({
          productId: item.product_id,
          qty: item.quantity,
          price: Number(item.price),
          productName: item.product_name,
        }))
      : [],
    total: Number(order.total),
    payment:
      order.payment_method === "cod"
        ? "Cash on Delivery"
        : order.payment_method,
    status: order.status,
  };
}

function formatBlockDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
    },
  );
}

export default function DeliveryPage() {
  const [members, setMembers] = useState<DeliveryMember[]>([]);
  const [assignments, setAssignments] = useState<
    Record<string, DeliveryAssignment>
  >({});
  const [deliveryStages, setDeliveryStages] = useState<
    Record<string, DeliveryStage>
  >({});
  const [apiOrders, setApiOrders] = useState<ApiOrder[]>([]);
  const [selectedMemberId, setSelectedMemberId] =
    useState(DEMO_MEMBER_ID);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] =
    useState(true);
  const [earnings, setEarnings] = useState<
    DeliveryEarning[]
  >([]);

  const [activeTab, setActiveTab] =
    useState<ActiveTab>("home");

  const [bookings, setBookings] = useState<BookedBlock[]>(
    [],
  );

  const [selectedBlock, setSelectedBlock] =
    useState<DeliveryBlock | null>(null);

  const [showCancellation, setShowCancellation] =
    useState(false);

  const [blockSearch, setBlockSearch] = useState("");

  const [loginId, setLoginId] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  async function loadOrders() {
    try {
      setIsLoadingOrders(true);

      const response = await fetch("/api/orders", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to fetch orders.");
      }

      const data = await response.json();

      setApiOrders(
        Array.isArray(data?.orders)
          ? data.orders
          : [],
      );
    } catch (error) {
      console.error(
        "Failed to load delivery orders:",
        error,
      );

      setApiOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }

  function loadDeliveryState() {
    const savedMembers = getSavedMembers();
    const savedAssignments = getAssignments();
    const savedStages = getStages();

    setMembers(savedMembers);
    setAssignments(savedAssignments);
    setDeliveryStages(savedStages);

    if (
      savedMembers.length > 0 &&
      !savedMembers.some(
        (member) => member.id === selectedMemberId,
      )
    ) {
      setSelectedMemberId(savedMembers[0].id);
    }
  }

  useEffect(() => {
    loadDeliveryState();
    loadOrders();
    setEarnings(getSavedEarnings());
    setBookings(getSavedBookings());

    const session = localStorage.getItem(
      DELIVERY_LOGIN_KEY,
    );

    if (session) {
      setIsLoggedIn(true);

      try {
        const parsed = JSON.parse(session);

        if (parsed?.memberId) {
          setSelectedMemberId(parsed.memberId);
        }
      } catch {
        // Keep existing session.
      }
    }

    const handleUpdate = () => {
      loadDeliveryState();
      loadOrders();
      setEarnings(getSavedEarnings());
      setBookings(getSavedBookings());
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    window.addEventListener(
      DELIVERY_UPDATED_EVENT,
      handleUpdate,
    );

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
      window.removeEventListener(
        DELIVERY_UPDATED_EVENT,
        handleUpdate,
      );
    };
  }, [selectedMemberId]);

  const currentMember = useMemo(() => {
    return (
      members.find(
        (member) => member.id === selectedMemberId,
      ) ?? null
    );
  }, [members, selectedMemberId]);

 async function handlePartnerLogin() {
  setLoginError("");

  const normalizedId = loginId.trim();
  const normalizedPhone = loginPhone.trim();

  if (!normalizedId || !normalizedPhone) {
    setLoginError("Enter your Partner ID and registered phone number.");
    return;
  }

  try {
    const response = await fetch("/delivery/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        partnerId: normalizedId,
        phone: normalizedPhone,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setLoginError(
        data.message || "Unable to sign in. Please check your details.",
      );
      return;
    }

    // Convert the DB partner into the format
    // already used by your existing delivery UI.
    const partner: DeliveryMember = {
      id: data.partner.id,
      name: data.partner.name,
      phone: data.partner.phone,
      status: normalizeStatus(data.partner.status),
      area: data.partner.area ?? "",
    };

    // Add/update the logged-in partner in state
    setMembers((current) => {
      const exists = current.some(
        (member) => member.id === partner.id,
      );

      if (exists) {
        return current.map((member) =>
          member.id === partner.id ? partner : member,
        );
      }

      return [...current, partner];
    });

    setSelectedMemberId(partner.id);

    sessionStorage.setItem(
      DELIVERY_LOGIN_KEY,
      JSON.stringify({
        memberId: partner.id,
        name: partner.name,
        loggedInAt: new Date().toISOString(),
      }),
    );

    setIsLoggedIn(true);
    setLoginError("");
  } catch (error) {
    console.error("Partner login error:", error);

    setLoginError(
      "Unable to connect to the server. Please try again.",
    );
  }
}

  function handleLogout() {
    localStorage.removeItem(DELIVERY_LOGIN_KEY);
    setIsLoggedIn(false);
    setActiveTab("home");
  }

  const assignedOrderId = useMemo(() => {
    if (!currentMember) {
      return undefined;
    }

    const assignmentEntry = Object.entries(
      assignments,
    ).find(
      ([orderId, assignment]) =>
        assignment?.memberId === currentMember.id &&
        deliveryStages[orderId] !== "delivered",
    );

    if (assignmentEntry) {
      return assignmentEntry[0];
    }

    if (
      currentMember.assignedOrder &&
      deliveryStages[currentMember.assignedOrder] !==
        "delivered"
    ) {
      return currentMember.assignedOrder;
    }

    return undefined;
  }, [
    currentMember,
    assignments,
    deliveryStages,
  ]);

  const assignedOrder = assignedOrderId
    ? apiOrders
        .map(mapApiOrder)
        .find(
          (order) => order.id === assignedOrderId,
        ) ?? null
    : null;

  const currentStage: DeliveryStage = assignedOrderId
    ? deliveryStages[assignedOrderId] ?? "assigned"
    : "assigned";

  function saveDeliveryState(
    nextMembers: DeliveryMember[],
    nextAssignments: Record<
      string,
      DeliveryAssignment
    >,
    nextStages: Record<string, DeliveryStage>,
  ) {
    localStorage.setItem(
      MEMBERS_KEY,
      JSON.stringify(nextMembers),
    );

    localStorage.setItem(
      ASSIGNMENTS_KEY,
      JSON.stringify(nextAssignments),
    );

    localStorage.setItem(
      DELIVERY_STAGES_KEY,
      JSON.stringify(nextStages),
    );

    setMembers(nextMembers);
    setAssignments(nextAssignments);
    setDeliveryStages(nextStages);

    window.dispatchEvent(
      new Event(DELIVERY_UPDATED_EVENT),
    );
  }

  function recordCompletedEarning(
    order: DeliveryOrder,
  ) {
    const existing = getSavedEarnings();

    if (
      existing.some(
        (earning) => earning.orderId === order.id,
      )
    ) {
      setEarnings(existing);
      return;
    }

    const earning: DeliveryEarning = {
      id: `${order.id}-${Date.now()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      partnerId: currentMember?.id ?? "",
      partnerName:
        currentMember?.name ?? "Delivery Partner",
      amount: DELIVERY_EARNING_AMOUNT,
      earnedAt: new Date().toISOString(),
    };

    const nextEarnings = [
      earning,
      ...existing,
    ];

    saveEarnings(nextEarnings);
    setEarnings(nextEarnings);
  }

  async function updateDeliveryStage(
    nextStage: DeliveryStage,
  ) {
    if (!currentMember || !assignedOrder) {
      return;
    }

    setIsUpdating(true);

    try {
      const orderId = assignedOrder.id;

      const supabaseStatus =
        nextStage === "out-for-delivery"
          ? "out-for-delivery"
          : nextStage === "delivered"
            ? "delivered"
            : null;

      if (supabaseStatus) {
        const response = await fetch("/api/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            status: supabaseStatus,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Unable to update order status.",
          );
        }

        setApiOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: supabaseStatus,
                }
              : order,
          ),
        );
      }

      const nextStages = {
        ...deliveryStages,
        [orderId]: nextStage,
      };

      let nextMembers = [...members];

      const nextAssignments = {
        ...assignments,
      };

      if (nextStage === "out-for-delivery") {
        nextMembers = nextMembers.map(
          (member) => {
            if (
              member.id !== currentMember.id
            ) {
              return member;
            }

            return {
              ...member,
              status: "out-on-delivery",
              assignedOrder: orderId,
            };
          },
        );
      }

      if (nextStage === "delivered") {
        recordCompletedEarning(assignedOrder);

        delete nextAssignments[orderId];

        nextMembers = nextMembers.map(
          (member) => {
            if (
              member.id !== currentMember.id
            ) {
              return member;
            }

            return {
              ...member,
              status: "available",
              assignedOrder: undefined,
            };
          },
        );
      }

      saveDeliveryState(
        nextMembers,
        nextAssignments,
        nextStages,
      );
    } catch (error) {
      console.error(
        "Failed to update delivery stage:",
        error,
      );
    } finally {
      setIsUpdating(false);
    }
  }

  function isBlockBooked(blockId: string) {
    return bookings.some(
      (booking) =>
        booking.blockId === blockId &&
        booking.partnerId === currentMember?.id &&
        booking.status === "booked",
    );
  }

  function hasScheduleConflict(block: DeliveryBlock) {
    return bookings.some((booking) => {
      if (
        booking.partnerId !== currentMember?.id ||
        booking.status !== "booked"
      ) {
        return false;
      }

      const bookedBlock = DELIVERY_BLOCKS.find(
        (item) => item.id === booking.blockId,
      );

      if (!bookedBlock) {
        return false;
      }

      if (bookedBlock.date !== block.date) {
        return false;
      }

      return (
        bookedBlock.startTime === block.startTime ||
        bookedBlock.endTime === block.endTime
      );
    });
  }

  function bookBlock(block: DeliveryBlock) {
    if (!currentMember) {
      return;
    }

    if (isBlockBooked(block.id)) {
      return;
    }

    if (hasScheduleConflict(block)) {
      alert(
        "You already have a booked block during this time.",
      );
      return;
    }

    const nextBookings = [
      ...bookings,
      {
        blockId: block.id,
        partnerId: currentMember.id,
        bookedAt: new Date().toISOString(),
        status: "booked" as const,
      },
    ];

    saveBookings(nextBookings);
    setBookings(nextBookings);
    setSelectedBlock(null);
    setActiveTab("schedule");
  }

  function cancelBlock(blockId: string) {
    const nextBookings = bookings.map(
      (booking) =>
        booking.blockId === blockId &&
        booking.partnerId === currentMember?.id &&
        booking.status === "booked"
          ? {
              ...booking,
              status: "cancelled" as const,
            }
          : booking,
    );

    saveBookings(nextBookings);
    setBookings(nextBookings);
    setShowCancellation(false);
    setSelectedBlock(null);
  }

  const now = new Date();

  const todayEarnings = earnings
    .filter((earning) =>
      isSameDay(
        new Date(earning.earnedAt),
        now,
      ),
    )
    .reduce(
      (sum, earning) =>
        sum + earning.amount,
      0,
    );

  const weekEarnings = earnings
    .filter((earning) =>
      isSameWeek(
        new Date(earning.earnedAt),
        now,
      ),
    )
    .reduce(
      (sum, earning) =>
        sum + earning.amount,
      0,
    );

  const monthEarnings = earnings
    .filter((earning) =>
      isSameMonth(
        new Date(earning.earnedAt),
        now,
      ),
    )
    .reduce(
      (sum, earning) =>
        sum + earning.amount,
      0,
    );

  const completedDeliveryCount =
    earnings.length;

  const currentBookings = bookings.filter(
    (booking) =>
      booking.partnerId === currentMember?.id &&
      booking.status === "booked",
  );

  const availableBlocks = DELIVERY_BLOCKS.filter(
    (block) => {
      const query = blockSearch
        .trim()
        .toLowerCase();

      if (!query) {
        return true;
      }

      return (
        block.pickupLocation
          .toLowerCase()
          .includes(query) ||
        block.deliveryArea
          .toLowerCase()
          .includes(query) ||
        formatBlockDate(block.date)
          .toLowerCase()
          .includes(query)
      );
    },
  );

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

  /*
   * Partner login
   */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-6xl items-center px-5 py-4">
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
          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center px-5 py-10">
          <section className="w-full rounded-3xl border border-border bg-white p-7 shadow-sm">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <Truck size={25} />
              </div>

              <p className="mt-5 text-sm font-medium text-teal-700">
                Delivery Partner Portal
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                Partner Login
              </h1>

              <p className="mt-2 text-sm leading-6 text-muted">
                Sign in to manage your delivery
                blocks, schedule, deliveries and
                earnings.
              </p>
            </div>

            {members.length === 0 ? (
              <div className="mt-7 rounded-2xl bg-slate-50 p-5 text-center">
                <p className="font-medium text-ink">
                  No delivery partner account found
                </p>

                <p className="mt-1 text-sm leading-5 text-muted">
                  Add a delivery partner from the
                  Admin Delivery page before signing
                  in.
                </p>
              </div>
            ) : (
              <div className="mt-7 space-y-4">
                <div>
                  <label className="text-sm font-medium text-ink">
                    Partner ID
                  </label>

                  <input
                    value={loginId}
                    onChange={(event) =>
                      setLoginId(
                        event.target.value,
                      )
                    }
                    placeholder="Enter partner ID"
                    className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-ink">
                    Registered phone
                  </label>

                  <input
                    value={loginPhone}
                    onChange={(event) =>
                      setLoginPhone(
                        event.target.value,
                      )
                    }
                    placeholder="Enter phone number"
                    inputMode="tel"
                    className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal-700"
                  />
                </div>

                {loginError && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {loginError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePartnerLogin}
                  className="w-full rounded-2xl bg-teal-700 px-5 py-4 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  Sign in
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

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

          <div className="flex items-center gap-3">
            {members.length > 1 && (
              <select
                value={selectedMemberId}
                onChange={(event) =>
                  setSelectedMemberId(
                    event.target.value,
                  )
                }
                className="hidden rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-teal-700 sm:block"
              >
                {members.map((member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >
                    {member.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <UserRound size={19} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        {/* =========================
            DASHBOARD
        ========================== */}
        {activeTab === "home" &&
        currentMember ? (
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

            {/* Earnings snapshot */}
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                <p className="text-sm text-muted">
                  Today's earnings
                </p>

                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  {formatCurrency(
                    todayEarnings,
                  )}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Completed delivery earnings
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                <p className="text-sm text-muted">
                  Booked blocks
                </p>

                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  {currentBookings.length}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Upcoming scheduled blocks
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                <p className="text-sm text-muted">
                  Available now
                </p>

                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  {DELIVERY_BLOCKS.length}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Delivery blocks
                </p>
              </div>
            </section>

            {/* Instant blocks */}
            <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-700">
                    Same-day availability
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-ink">
                    Instant blocks
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    Accept an available block and see
                    its earnings before you commit.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab("blocks")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink transition hover:bg-slate-50"
                >
                  View all
                  <ChevronRight size={15} />
                </button>
              </div>

              <div className="mt-5">
                {DELIVERY_BLOCKS.slice(0, 1).map(
                  (block) => (
                    <div
                      key={block.id}
                      className="rounded-2xl bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                              <span className="inline-flex items-center gap-1">
                                <Zap size={12} />
                                Available
                              </span>
                            </span>

                            <span className="text-xs text-muted">
                              {formatBlockDate(
                                block.date,
                              )}
                            </span>
                          </div>

                          <p className="mt-3 font-semibold text-ink">
                            {block.startTime} –{" "}
                            {block.endTime}
                          </p>

                          <p className="mt-1 text-sm text-muted">
                            {block.deliveryArea}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-muted">
                              Estimated earnings
                            </p>

                            <p className="mt-1 text-lg font-semibold text-emerald-700">
                              {formatCurrency(
                                block
                                  .estimatedEarnings
                                  .minimum,
                              )}
                              {" – "}
                              {formatCurrency(
                                block
                                  .estimatedEarnings
                                  .maximum,
                              )}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedBlock(
                                block,
                              )
                            }
                            className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>

            {/* Active delivery */}
            {isLoadingOrders ? (
              <section className="rounded-3xl border border-border bg-white p-10 text-center shadow-sm">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />

                <p className="mt-4 text-sm text-muted">
                  Loading delivery orders...
                </p>
              </section>
            ) : assignedOrder ? (
              <section className="space-y-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-teal-700">
                      Active delivery
                    </p>

                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                      Order #
                      {assignedOrder.orderNumber}
                    </h1>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">
                    <Clock3 size={15} />
                    {stageLabel(currentStage)}
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
                        {assignedOrder.customerName}
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

                          {assignedOrder.customerPhone ? (
                            <>
                              <p className="mt-1 text-sm font-medium text-ink">
                                {
                                  assignedOrder.customerPhone
                                }
                              </p>

                              <a
                                href={`tel:${assignedOrder.customerPhone}`}
                                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-teal-800"
                              >
                                <Phone size={13} />
                                Call customer
                              </a>
                            </>
                          ) : (
                            <p className="mt-1 text-sm text-muted">
                              Customer phone is not
                              available.
                            </p>
                          )}
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
                              {item.productName}
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
                  {currentStage === "assigned" ? (
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
                        <CheckCircle2 size={18} />

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
        ) : activeTab === "blocks" &&
          currentMember ? (
          /* =========================
             FIND BLOCKS
          ========================== */
          <section className="space-y-6">
            <div>
              <p className="text-sm font-medium text-teal-700">
                Delivery blocks
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                Find a block
              </h1>

              <p className="mt-1 text-sm text-muted">
                Choose a delivery block that fits
                your schedule. Earnings are shown
                before acceptance.
              </p>
            </div>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />

              <input
                value={blockSearch}
                onChange={(event) =>
                  setBlockSearch(
                    event.target.value,
                  )
                }
                placeholder="Search by area, pickup location or date"
                className="w-full rounded-2xl border border-border bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none focus:border-teal-700"
              />
            </div>

            <div className="space-y-4">
              {availableBlocks.map((block) => {
                const booked =
                  isBlockBooked(block.id);

                return (
                  <div
                    key={block.id}
                    className="rounded-3xl border border-border bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                            {formatBlockDate(
                              block.date,
                            )}
                          </span>

                          {booked && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                              Booked
                            </span>
                          )}
                        </div>

                        <h2 className="mt-3 text-lg font-semibold text-ink">
                          {block.startTime} –{" "}
                          {block.endTime}
                        </h2>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="flex items-start gap-2">
                            <MapPin
                              size={17}
                              className="mt-0.5 shrink-0 text-teal-700"
                            />

                            <div>
                              <p className="text-xs text-muted">
                                Pickup
                              </p>

                              <p className="text-sm font-medium text-ink">
                                {
                                  block.pickupLocation
                                }
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Truck
                              size={17}
                              className="mt-0.5 shrink-0 text-teal-700"
                            />

                            <div>
                              <p className="text-xs text-muted">
                                Delivery area
                              </p>

                              <p className="text-sm font-medium text-ink">
                                {
                                  block.deliveryArea
                                }
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Clock3
                              size={17}
                              className="mt-0.5 shrink-0 text-teal-700"
                            />

                            <div>
                              <p className="text-xs text-muted">
                                Duration
                              </p>

                              <p className="text-sm font-medium text-ink">
                                {
                                  block.durationHours
                                }{" "}
                                hours
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Package
                              size={17}
                              className="mt-0.5 shrink-0 text-teal-700"
                            />

                            <div>
                              <p className="text-xs text-muted">
                                Expected deliveries
                              </p>

                              <p className="text-sm font-medium text-ink">
                                {
                                  block.expectedDeliveries
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5 lg:min-w-[260px]">
                        <p className="text-xs text-muted">
                          Estimated earnings
                        </p>

                        <p className="mt-1 text-2xl font-semibold text-emerald-700">
                          {formatCurrency(
                            block.estimatedEarnings
                              .minimum,
                          )}
                          {" – "}
                          {formatCurrency(
                            block.estimatedEarnings
                              .maximum,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          Includes up to{" "}
                          {formatCurrency(
                            block.incentives,
                          )}{" "}
                          applicable incentives
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedBlock(
                              block,
                            )
                          }
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                        >
                          {booked
                            ? "View booking"
                            : "View details"}
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {availableBlocks.length === 0 && (
                <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-12 text-center">
                  <CalendarDays
                    size={30}
                    className="mx-auto text-muted"
                  />

                  <p className="mt-3 font-medium text-ink">
                    No matching blocks
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    Try another area or date.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : activeTab === "schedule" &&
          currentMember ? (
          /* =========================
             MY SCHEDULE
          ========================== */
          <section className="space-y-6">
            <div>
              <p className="text-sm font-medium text-teal-700">
                My schedule
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                Booked blocks
              </h1>

              <p className="mt-1 text-sm text-muted">
                Manage your upcoming delivery
                schedule.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <CalendarDays size={19} />
                </div>

                <div>
                  <h2 className="font-semibold text-ink">
                    Upcoming schedule
                  </h2>

                  <p className="text-sm text-muted">
                    {currentBookings.length} booked
                    block
                    {currentBookings.length !== 1
                      ? "s"
                      : ""}
                  </p>
                </div>
              </div>

              {currentBookings.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-border bg-slate-50 px-6 py-10 text-center">
                  <CalendarDays
                    size={28}
                    className="mx-auto text-muted"
                  />

                  <p className="mt-3 font-medium text-ink">
                    No blocks booked
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    Choose an available delivery
                    block to add it to your schedule.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab("blocks")
                    }
                    className="mt-4 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Find blocks
                  </button>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {currentBookings.map(
                    (booking) => {
                      const block =
                        DELIVERY_BLOCKS.find(
                          (item) =>
                            item.id ===
                            booking.blockId,
                        );

                      if (!block) {
                        return null;
                      }

                      return (
                        <button
                          type="button"
                          key={booking.blockId}
                          onClick={() =>
                            setSelectedBlock(
                              block,
                            )
                          }
                          className="w-full rounded-2xl border border-border bg-white p-5 text-left transition hover:bg-slate-50"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                  Booked
                                </span>

                                <span className="text-xs text-muted">
                                  {formatBlockDate(
                                    block.date,
                                  )}
                                </span>
                              </div>

                              <p className="mt-3 font-semibold text-ink">
                                {block.startTime} –{" "}
                                {block.endTime}
                              </p>

                              <p className="mt-1 text-sm text-muted">
                                {
                                  block.deliveryArea
                                }
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-muted">
                                Estimated
                              </p>

                              <p className="mt-1 font-semibold text-emerald-700">
                                {formatCurrency(
                                  block
                                    .estimatedEarnings
                                    .minimum,
                                )}
                                {" – "}
                                {formatCurrency(
                                  block
                                    .estimatedEarnings
                                    .maximum,
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </section>
        ) : activeTab === "earnings" ? (
          /* =========================
             EARNINGS
          ========================== */
          <section className="space-y-6">
            <div>
              <p className="text-sm font-medium text-teal-700">
                Earnings
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                Earnings dashboard
              </h1>

              <p className="mt-1 text-sm text-muted">
                Track your delivery earnings by
                day, week, and month.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                <p className="text-sm text-muted">
                  Today
                </p>

                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  {formatCurrency(
                    todayEarnings,
                  )}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Delivery earnings
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                <p className="text-sm text-muted">
                  This week
                </p>

                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  {formatCurrency(
                    weekEarnings,
                  )}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Monday to today
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
                <p className="text-sm text-muted">
                  This month
                </p>

                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  {formatCurrency(
                    monthEarnings,
                  )}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Current calendar month
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink">
                    Delivery summary
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    Completed deliveries contributing
                    to your earnings.
                  </p>
                </div>

                <div className="rounded-xl bg-teal-50 px-4 py-3 text-center">
                  <p className="text-2xl font-semibold text-teal-800">
                    {completedDeliveryCount}
                  </p>

                  <p className="text-xs font-medium text-teal-700">
                    completed
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-ink">
                    Recent earnings
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    Your latest completed deliveries.
                  </p>
                </div>
              </div>

              {earnings.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-border bg-slate-50 px-6 py-10 text-center">
                  <Wallet
                    size={28}
                    className="mx-auto text-muted"
                  />

                  <p className="mt-3 font-medium text-ink">
                    No earnings yet
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    Earnings will appear here after
                    you complete a delivery.
                  </p>
                </div>
              ) : (
                <div className="mt-5 divide-y divide-border">
                  {earnings
                    .slice(0, 8)
                    .map((earning) => (
                      <div
                        key={earning.id}
                        className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-ink">
                            Order #
                            {earning.orderNumber}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {new Date(
                              earning.earnedAt,
                            ).toLocaleString(
                              "en-IN",
                              {
                                dateStyle:
                                  "medium",
                                timeStyle:
                                  "short",
                              },
                            )}
                          </p>
                        </div>

                        <p className="text-lg font-semibold text-emerald-700">
                          +
                          {formatCurrency(
                            earning.amount,
                          )}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>
        ) : activeTab === "profile" &&
          currentMember ? (
          /* =========================
             PROFILE
          ========================== */
          <section className="space-y-6">
            <div>
              <p className="text-sm font-medium text-teal-700">
                Account
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                Partner profile
              </h1>

              <p className="mt-1 text-sm text-muted">
                Manage your delivery partner account.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <UserRound size={25} />
                </div>

                <div>
                  <p className="text-xl font-semibold text-ink">
                    {currentMember.name}
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    Partner ID: {currentMember.id}
                  </p>
                </div>
              </div>

              <div className="mt-6 divide-y divide-border">
                <div className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-xs text-muted">
                      Registered phone
                    </p>

                    <p className="mt-1 text-sm font-medium text-ink">
                      {currentMember.phone ||
                        "Not provided"}
                    </p>
                  </div>

                  <Phone
                    size={18}
                    className="text-muted"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-xs text-muted">
                      Service area
                    </p>

                    <p className="mt-1 text-sm font-medium text-ink">
                      {currentMember.area ||
                        "Assigned delivery area"}
                    </p>
                  </div>

                  <MapPin
                    size={18}
                    className="text-muted"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-xs text-muted">
                      Account status
                    </p>

                    <p className="mt-1 text-sm font-medium text-ink">
                      {statusText}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}
                  >
                    {statusText}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ink">
                Partner access
              </h2>

              <p className="mt-1 text-sm text-muted">
                Sign out of this delivery partner
                session on this device.
              </p>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          </section>
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
              Add a delivery member from the Admin
              Delivery page.
            </p>
          </section>
        )}
      </main>

      {/* =========================
          BLOCK DETAILS MODAL
      ========================== */}
      {selectedBlock && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-5">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-teal-700">
                  Block details
                </p>

                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {formatBlockDate(
                    selectedBlock.date,
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedBlock(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <p className="text-2xl font-semibold text-ink">
                {selectedBlock.startTime} –{" "}
                {selectedBlock.endTime}
              </p>

              <p className="mt-1 text-sm text-muted">
                {selectedBlock.durationHours} hour
                block
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted">
                  Pickup location
                </p>

                <p className="mt-1 text-sm font-medium text-ink">
                  {selectedBlock.pickupLocation}
                </p>
              </div>

              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted">
                  Delivery area
                </p>

                <p className="mt-1 text-sm font-medium text-ink">
                  {selectedBlock.deliveryArea}
                </p>
              </div>

              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted">
                  Expected deliveries
                </p>

                <p className="mt-1 text-sm font-medium text-ink">
                  {selectedBlock.expectedDeliveries}
                </p>
              </div>

              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted">
                  Applicable incentives
                </p>

                <p className="mt-1 text-sm font-medium text-ink">
                  Up to{" "}
                  {formatCurrency(
                    selectedBlock.incentives,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-800">
                Estimated earnings
              </p>

              <p className="mt-1 text-2xl font-semibold text-emerald-700">
                {formatCurrency(
                  selectedBlock
                    .estimatedEarnings.minimum,
                )}
                {" – "}
                {formatCurrency(
                  selectedBlock
                    .estimatedEarnings.maximum,
                )}
              </p>

              <p className="mt-2 text-xs leading-5 text-emerald-700">
                The estimated earnings range is
                shown before block acceptance.
                Final earnings depend on completed
                deliveries and applicable incentives.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-border p-5">
              <p className="font-semibold text-ink">
                Cancellation policy
              </p>

              <ul className="mt-3 space-y-2 text-sm leading-5 text-muted">
                <li>
                  • Cancel within the permitted
                  cancellation window to avoid
                  eligibility impact.
                </li>

                <li>
                  • Late cancellations may affect
                  access to future blocks or
                  incentives.
                </li>

                <li>
                  • Repeated cancellations may be
                  reviewed according to partner
                  policy.
                </li>
              </ul>
            </div>

            {isBlockBooked(
              selectedBlock.id,
            ) ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setShowCancellation(true)
                  }
                  className="mt-6 w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Cancel block
                </button>

                {showCancellation && (
                  <div className="mt-3 rounded-2xl border border-red-200 bg-white p-5">
                    <p className="font-semibold text-ink">
                      Cancel this block?
                    </p>

                    <p className="mt-1 text-sm leading-5 text-muted">
                      This will remove the block
                      from your upcoming schedule.
                      Any applicable cancellation
                      policy will still apply.
                    </p>

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setShowCancellation(
                            false,
                          )
                        }
                        className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-ink"
                      >
                        Keep block
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          cancelBlock(
                            selectedBlock.id,
                          )
                        }
                        className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
                      >
                        Confirm cancellation
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() =>
                  bookBlock(selectedBlock)
                }
                className="mt-6 w-full rounded-2xl bg-teal-700 px-5 py-4 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Book this block
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================
          BOTTOM NAVIGATION
      ========================== */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white">
        <div className="mx-auto grid max-w-2xl grid-cols-5">
          <button
            type="button"
            onClick={() =>
              setActiveTab("home")
            }
            className={`flex flex-col items-center gap-1 px-2 py-3 ${
              activeTab === "home"
                ? "text-teal-700"
                : "text-muted"
            }`}
          >
            <Home size={20} />

            <span className="text-xs font-medium">
              Home
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("blocks")
            }
            className={`flex flex-col items-center gap-1 px-2 py-3 ${
              activeTab === "blocks"
                ? "text-teal-700"
                : "text-muted"
            }`}
          >
            <Zap size={20} />

            <span className="text-xs font-medium">
              Blocks
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("schedule")
            }
            className={`flex flex-col items-center gap-1 px-2 py-3 ${
              activeTab === "schedule"
                ? "text-teal-700"
                : "text-muted"
            }`}
          >
            <CalendarDays size={20} />

            <span className="text-xs font-medium">
              Schedule
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("earnings")
            }
            className={`flex flex-col items-center gap-1 px-2 py-3 ${
              activeTab === "earnings"
                ? "text-teal-700"
                : "text-muted"
            }`}
          >
            <Wallet size={20} />

            <span className="text-xs font-medium">
              Earnings
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("profile")
            }
            className={`flex flex-col items-center gap-1 px-2 py-3 ${
              activeTab === "profile"
                ? "text-teal-700"
                : "text-muted"
            }`}
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