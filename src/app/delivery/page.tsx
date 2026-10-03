"use client";

import { useEffect, useMemo, useState } from "react";

import NotificationBell from "@/components/notification-bell";
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

  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupArea, setSignupArea] = useState("");
  const [signupVehicleType, setSignupVehicleType] = useState("");
  const [signupVehicleNumber, setSignupVehicleNumber] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const navigateToCustomer = (address: string) => {
  if (!address?.trim()) {
    return;
  }

  const destination = encodeURIComponent(address.trim());

  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
    "_blank",
    "noopener,noreferrer",
  );
};
  function normalizePhoneForMatch(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) {
      return digits.slice(2);
    }
    return digits;
  }

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
    setAuthMessage("");

    const name = loginName.trim();
    const password = loginPassword;

    if (!name || !password) {
      setLoginError(
        "Enter your registered name and password.",
      );
      return;
    }

    setAuthLoading(true);

    try {
      const response = await fetch("/api/delivery/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          password,
        }),
      });

      const responseText = await response.text();

      let data: any;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        throw new Error(
          `Delivery login API returned an invalid response (${response.status}).`,
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to sign in. Please check your details.",
        );
      }

     

      const savedMembers = getSavedMembers();
      const localMember = savedMembers.find(
        (member) =>
          member.id === data.partner.id ||
          member.name.trim().toLowerCase() ===
            String(data.partner.name ?? "").trim().toLowerCase(),
      );

      const partner: DeliveryMember = {
        id: localMember?.id ?? data.partner.id,
        name: data.partner.name,
        phone: data.partner.phone,
        status: normalizeStatus(data.partner.status),
        area: data.partner.area ?? "",
        assignedOrder: localMember?.assignedOrder,
      };

      setMembers((current) => {
        const exists = current.some(
          (member) => member.id === partner.id,
        );

        const updated = exists
          ? current.map((member) =>
              member.id === partner.id ? partner : member,
            )
          : [...current, partner];

        localStorage.setItem(
          MEMBERS_KEY,
          JSON.stringify(updated),
        );

        return updated;
      });

      setSelectedMemberId(partner.id);

      localStorage.setItem(
        DELIVERY_LOGIN_KEY,
        JSON.stringify({
          memberId: partner.id,
          name: partner.name,
          loggedInAt: new Date().toISOString(),
        }),
      );

      setIsLoggedIn(true);
      setLoginError("");
      setLoginPassword("");
    } catch (error) {
      console.error("Partner login error:", error);

      setLoginError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function handlePartnerSignup() {
    setLoginError("");
    setAuthMessage("");

    const name = signupName.trim();
    const phone = signupPhone.trim();
    const email = signupEmail.trim();
    const area = signupArea.trim();
    const vehicleType = signupVehicleType.trim();
    const vehicleNumber = signupVehicleNumber.trim();

    if (!name || !phone) {
      setLoginError(
        "Name and registered phone number are required.",
      );
      return;
    }

    if (!signupPassword) {
      setLoginError("Please create a password.");
      return;
    }

    if (signupPassword.length < 6) {
      setLoginError(
        "Password must be at least 6 characters long.",
      );
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setLoginError("Passwords do not match.");
      return;
    }

    setAuthLoading(true);

    try {
      const response = await fetch("/api/delivery/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          area,
          vehicleType,
          vehicleNumber,
          password: signupPassword,
          confirmPassword: signupConfirmPassword,
        }),
      });

      const responseText = await response.text();

      let data: any;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        throw new Error(
          `Delivery signup API returned an invalid response (${response.status}).`,
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to create the delivery partner account.",
        );
      }

      const newPartner: DeliveryMember = {
        id: data.partner.id,
        name: data.partner.name,
        phone: data.partner.phone,
        status: normalizeStatus(data.partner.status),
        area: data.partner.area ?? "",
      };

      setMembers((current) => {
        const exists = current.some(
          (member) => member.id === newPartner.id,
        );

        if (exists) {
          return current;
        }

        const updated = [...current, newPartner];

        localStorage.setItem(
          MEMBERS_KEY,
          JSON.stringify(updated),
        );

        return updated;
      });

      setLoginName(name);
      setLoginPassword("");
      setAuthMessage(
        "Account created successfully. Please sign in with your phone number and password.",
      );

      setSignupName("");
      setSignupPhone("");
      setSignupEmail("");
      setSignupArea("");
      setSignupVehicleType("");
      setSignupVehicleNumber("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setIsSignup(false);
    } catch (error) {
      console.error("Partner signup error:", error);

      setLoginError(
        error instanceof Error
          ? error.message
          : "Unable to create the account.",
      );
    } finally {
      setAuthLoading(false);
    }
  }

 async function handleLogout() {
  localStorage.removeItem(DELIVERY_LOGIN_KEY);
  setIsLoggedIn(false);
  setActiveTab("home");
  setLoginPassword("");
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

<<<<<<< HEAD
 async function recordCompletedEarning(
=======
async function recordCompletedEarning(
>>>>>>> 2c9007af25ef68ab1853397cef3dfd80930ac3fd
  order: DeliveryOrder,
) {
  const partnerId = currentMember?.id;

  if (!partnerId) {
    console.error(
      "Unable to record earning: delivery partner not found.",
    );
    return;
  }

<<<<<<< HEAD
=======
  let tipAmount = 0;

  try {
    const tipResponse = await fetch(
      `/api/delivery/tip?orderId=${encodeURIComponent(
        order.id,
      )}&partnerId=${encodeURIComponent(
        partnerId,
      )}`,
      {
        cache: "no-store",
      },
    );

    if (tipResponse.ok) {
      const tipData = await tipResponse.json();

      tipAmount = Number(
        tipData?.tip?.amount ?? 0,
      );
    }
  } catch (error) {
    console.error(
      "Failed to load delivery tip:",
      error,
    );
  }

>>>>>>> 2c9007af25ef68ab1853397cef3dfd80930ac3fd
  try {
    const response = await fetch(
      "/api/delivery/earnings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partnerId,
          orderId: order.id,
<<<<<<< HEAD
          amount: DELIVERY_EARNING_AMOUNT,
          baseAmount: DELIVERY_EARNING_AMOUNT,
          incentiveAmount: 0,
          tipAmount: 0,
=======
          amount:
            DELIVERY_EARNING_AMOUNT +
            tipAmount,
          baseAmount:
            DELIVERY_EARNING_AMOUNT,
          incentiveAmount: 0,
          tipAmount,
>>>>>>> 2c9007af25ef68ab1853397cef3dfd80930ac3fd
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Failed to save earning to database:",
        data?.error,
      );
    }
  } catch (error) {
    console.error(
      "Failed to save earning to database:",
      error,
    );
  }

  // Keep the existing local earnings dashboard working.
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
    partnerId,
    partnerName:
      currentMember?.name ?? "Delivery Partner",
<<<<<<< HEAD
    amount: DELIVERY_EARNING_AMOUNT,
=======
    amount:
      DELIVERY_EARNING_AMOUNT +
      tipAmount,
>>>>>>> 2c9007af25ef68ab1853397cef3dfd80930ac3fd
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
            deliveryPartnerId: currentMember.id,
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
       await recordCompletedEarning(assignedOrder);

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
const todayCompletedCount = earnings.filter((earning) =>
  isSameDay(new Date(earning.earnedAt), new Date()),
).length;
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
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-5">
    
    {/* Brand / Partner greeting */}
    <button
      type="button"
      onClick={() => setActiveTab("home")}
      className="flex min-w-0 items-center gap-3 text-left"
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-sm">
        <Truck size={20} />

        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
            currentMember?.status === "offline"
              ? "bg-slate-400"
              : "bg-emerald-500"
          }`}
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink sm:text-base">
          {currentMember?.name
            ? `Hi, ${currentMember.name.split(" ")[0]}`
            : "Delivery Partner"}
        </p>

        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              currentMember?.status === "offline"
                ? "bg-slate-400"
                : "bg-emerald-500"
            }`}
          />

          <p className="text-xs text-muted">
            {statusText}
          </p>
        </div>
      </div>
    </button>

    {/* Header actions */}
    <div className="flex items-center gap-1.5">
      {members.length > 1 && (
        <select
          value={selectedMemberId}
          onChange={(event) => setSelectedMemberId(event.target.value)}
          className="hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-teal-500 sm:block"
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      )}

      <NotificationBell
        recipientId={currentMember?.id ?? ""}
        recipientType="delivery_partner"
      />

      <button
        type="button"
        onClick={() => setActiveTab("profile")}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-sm active:scale-95"
        aria-label="Open profile"
      >
        <UserRound size={18} />
      </button>
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

            <div className="mt-7 space-y-4">
              {!isSignup ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-ink">
                      Name
                    </label>

                    <input
                      value={loginName}
                      onChange={(event) =>
                        setLoginName(event.target.value)
                      }
                      placeholder="Enter your name"
                      className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-ink">
                      Password
                    </label>

                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(event) =>
                        setLoginPassword(event.target.value)
                      }
                      placeholder="Enter password"
                      className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal-700"
                    />
                  </div>

                  {authMessage && (
                    <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                      {authMessage}
                    </div>
                  )}

                  {loginError && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePartnerLogin}
                    disabled={authLoading}
                    className="w-full rounded-2xl bg-teal-700 px-5 py-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {authLoading ? "Signing in..." : "Sign in"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(true);
                      setLoginError("");
                      setAuthMessage("");
                    }}
                    className="w-full text-sm font-medium text-teal-700 hover:underline"
                  >
                    First time? Create an account
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-ink">
                      Name
                    </label>

                    <input
                      value={signupName}
                      onChange={(event) =>
                        setSignupName(event.target.value)
                      }
                      placeholder="Enter your name"
                      className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-ink">
                      Registered phone
                    </label>

                    <input
                      value={signupPhone}
                      onChange={(event) =>
                        setSignupPhone(event.target.value)
                      }
                      placeholder="Enter phone number"
                      inputMode="tel"
                      className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-ink">
                      Email
                    </label>

                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(event) =>
                        setSignupEmail(event.target.value)
                      }
                      placeholder="Enter email"
                      className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-ink">
                      Area
                    </label>

                    <input
                      value={signupArea}
                      onChange={(event) =>
                        setSignupArea(event.target.value)
                      }
                      placeholder="Enter delivery area"
                      className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-ink">
                      Vehicle type
                    </label>

                    <input
                      value={signupVehicleType}
                      onChange={(event) =>
                        setSignupVehicleType(event.target.value)
                      }
                      placeholder="Bike / Scooter / Car"
                      className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-ink">
                      Vehicle number
                    </label>

                    <input
                      value={signupVehicleNumber}
                      onChange={(event) =>
                        setSignupVehicleNumber(event.target.value)
                      }
                      placeholder="Enter vehicle number"
                      className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-ink">
                      Create password
                    </label>

                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(event) =>
                        setSignupPassword(event.target.value)
                      }
                      placeholder="Create password"
                      className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-ink">
                      Confirm password
                    </label>

                    <input
                      type="password"
                      value={signupConfirmPassword}
                      onChange={(event) =>
                        setSignupConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm password"
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
                    onClick={handlePartnerSignup}
                    disabled={authLoading}
                    className="w-full rounded-2xl bg-teal-700 px-5 py-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {authLoading
                      ? "Creating account..."
                      : "Create account"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(false);
                      setLoginError("");
                      setAuthMessage("");
                    }}
                    className="w-full text-sm font-medium text-teal-700 hover:underline"
                  >
                    Already have an account? Sign in
                  </button>
                </>
              )}
            </div>
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
                SundayShop
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
            <NotificationBell
  recipientId={currentMember?.id ?? ""}
  recipientType="delivery_partner"
/>

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
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
  <div className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted">
          Today's earnings
        </p>

        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
          {formatCurrency(todayEarnings)}
        </p>
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Wallet size={19} />
      </div>
    </div>

    <p className="mt-3 text-xs text-muted">
      {todayCompletedCount} completed{" "}
      {todayCompletedCount === 1 ? "delivery" : "deliveries"}
    </p>
  </div>

  <div className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted">
          Booked blocks
        </p>

        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
          {currentBookings.length}
        </p>
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <CalendarDays size={19} />
      </div>
    </div>

    <p className="mt-3 text-xs text-muted">
      Upcoming delivery slots
    </p>
  </div>

  <div className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted">
          Available now
        </p>

        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
          {DELIVERY_BLOCKS.length}
        </p>
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
        <Truck size={19} />
      </div>
    </div>

    <p className="mt-3 text-xs text-muted">
      Delivery blocks available
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
  <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-teal-700" />

    <p className="mt-4 text-sm font-medium text-slate-600">
      Loading delivery orders...
    </p>
  </section>
) : assignedOrder ? (
  <section className="space-y-5">
    {/* Delivery header */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />

          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Active delivery
          </p>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Order #{assignedOrder.orderNumber}
        </h1>

        <p className="mt-1 text-sm text-muted">
          Complete this delivery to earn ₹
          {DELIVERY_EARNING_AMOUNT}
          {assignedOrder.customerName
            ? ` + applicable tip`
            : ""}
        </p>
      </div>

      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-100">
        <Clock3 size={15} />
        {stageLabel(currentStage)}
      </span>
    </div>

    {/* Delivery progress */}
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">
          Delivery progress
        </p>

        <p className="text-xs font-medium text-muted">
          {currentStage === "assigned"
            ? "1 of 3"
            : currentStage === "out-for-delivery"
              ? "2 of 3"
              : currentStage === "near-customer"
                ? "3 of 3"
                : "Completed"}
        </p>
      </div>

      <div className="mt-5 flex items-center">
        <div className="flex items-center">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              currentStage === "assigned"
                ? "bg-teal-700 text-white"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <Package size={16} />
          </div>

          <div
            className={`h-1 w-12 sm:w-20 ${
              currentStage === "assigned"
                ? "bg-slate-200"
                : "bg-emerald-500"
            }`}
          />
        </div>

        <div className="flex items-center">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              currentStage === "assigned"
                ? "bg-slate-100 text-slate-400"
                : currentStage === "out-for-delivery"
                  ? "bg-teal-700 text-white"
                  : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <Truck size={16} />
          </div>

          <div
            className={`h-1 w-12 sm:w-20 ${
              currentStage === "assigned" ||
              currentStage === "out-for-delivery"
                ? "bg-slate-200"
                : "bg-emerald-500"
            }`}
          />
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            currentStage === "near-customer"
              ? "bg-teal-700 text-white"
              : currentStage === "delivered"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-400"
          }`}
        >
          <CheckCircle2 size={16} />
        </div>
      </div>

      <div className="mt-3 flex justify-between text-[11px] font-medium text-muted">
        <span>Assigned</span>
        <span>On the way</span>
        <span>Delivered</span>
      </div>
    </div>

    {/* Customer */}
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <UserRound size={19} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Customer
            </p>

            <p className="mt-0.5 font-semibold text-ink">
              {assignedOrder.customerName}
            </p>
          </div>
        </div>

        {assignedOrder.customerPhone && (
          <a
            href={`tel:${assignedOrder.customerPhone}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white transition-all duration-200 hover:bg-teal-800 hover:shadow-md active:scale-95"
            aria-label="Call customer"
          >
            <Phone size={18} />
          </a>
        )}
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <MapPin
            size={19}
            className="mt-0.5 shrink-0 text-teal-700"
          />

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Delivery address
            </p>

            <p className="mt-1 text-sm leading-6 text-ink">
              {assignedOrder.address}
            </p>
          </div>
        </div>
      </div>

      {assignedOrder.customerPhone && (
        <p className="mt-3 text-xs text-muted">
          Customer: {assignedOrder.customerPhone}
        </p>
      )}
    </div>

    {/* Map */}
   {/* Navigation */}
<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
  <div className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-slate-100 p-6 sm:p-8">
    <div className="absolute inset-0 opacity-30">
      <div className="absolute left-0 top-1/2 h-px w-full rotate-6 bg-slate-300" />
      <div className="absolute left-1/4 top-0 h-full w-px -rotate-12 bg-slate-300" />
      <div className="absolute right-1/4 top-0 h-full w-px rotate-12 bg-slate-300" />
    </div>

    <div className="relative">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-sm">
            <MapPin size={25} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Customer location
            </p>

            <h2 className="mt-1 text-lg font-bold text-ink">
              Navigate to customer
            </h2>

            <p className="mt-1 max-w-lg text-sm leading-5 text-muted">
              Open turn-by-turn directions to the
              customer's delivery address.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            navigateToCustomer(
              assignedOrder.address,
            )
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-md active:scale-[0.99] sm:w-auto sm:min-w-[210px]"
        >
          <MapPin size={18} />
          Navigate to customer
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white/90 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <MapPin
            size={18}
            className="mt-0.5 shrink-0 text-teal-700"
          />

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Destination
            </p>

            <p className="mt-1 text-sm leading-6 text-ink">
              {assignedOrder.address}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

    {/* Order details */}
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <Package size={19} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Order details
            </p>

            <p className="mt-0.5 font-semibold text-ink">
              {assignedOrder.items.length}{" "}
              {assignedOrder.items.length === 1
                ? "item"
                : "items"}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          {assignedOrder.payment}
        </span>
      </div>

      <div className="mt-5 divide-y divide-slate-100">
        {assignedOrder.items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {item.productName}
              </p>

              <p className="mt-1 text-xs text-muted">
                Quantity: {item.qty}
              </p>
            </div>

            <p className="shrink-0 text-sm font-semibold text-ink">
              ₹
              {(item.price * item.qty).toLocaleString(
                "en-IN",
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-end justify-between border-t border-slate-200 pt-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Payment
          </p>

          <p className="mt-1 text-sm font-semibold text-ink">
            {assignedOrder.payment}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Total
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
            ₹
            {assignedOrder.total.toLocaleString(
              "en-IN",
            )}
          </p>
        </div>
      </div>
    </div>

    {/* Delivery actions */}
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {currentStage === "assigned" ? (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() =>
            updateDeliveryStage("out-for-delivery")
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-md active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Truck size={18} />

          {isUpdating
            ? "Updating..."
            : "Start delivery"}
        </button>
      ) : currentStage === "out-for-delivery" ? (
        <div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Truck
                size={19}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="font-semibold text-amber-900">
                  You're on the way
                </p>

                <p className="mt-1 text-sm leading-5 text-amber-700">
                  The customer is waiting for their
                  delivery.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-400"
          >
            <MapPin size={18} />
            Near customer — GPS coming next
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() =>
              updateDeliveryStage("delivered")
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 size={18} />

            {isUpdating
              ? "Updating..."
              : "Mark as delivered"}
          </button>
        </div>
      ) : currentStage === "near-customer" ? (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() =>
            updateDeliveryStage("delivered")
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 size={18} />

          {isUpdating
            ? "Updating..."
            : "Mark as delivered"}
        </button>
      ) : (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={25} />
          </div>

          <p className="mt-3 font-semibold text-emerald-800">
            Delivery completed
          </p>

          <p className="mt-1 text-xs text-emerald-700">
            Earnings have been recorded.
          </p>
        </div>
      )}
    </div>
  </section>
) : (
  <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
      <CheckCircle2 size={30} />
    </div>

    <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">
      You're all caught up!
    </h1>

    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
      No active deliveries at the moment. New
      orders will be assigned automatically when
      you become eligible.
    </p>

    <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
      <CheckCircle2 size={14} />
      Ready for your next delivery
    </div>
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
                            block.date
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
                   <button
      type="button"
      onClick={() => {
        window.location.href =
          "/delivery/earnings";
      }}
      className="flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
    >
      Earnings & Settlement
      <ChevronRight size={16} />
    </button>
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
  {/* Profile header */}
  <div>
    <p className="text-sm font-medium text-teal-700">
      Account
    </p>

    <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
      Partner profile
    </h1>

    <p className="mt-1 text-sm text-muted">
      Manage your delivery partner account and activity.
    </p>
  </div>

  {/* Partner identity */}
  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="bg-gradient-to-br from-teal-700 to-teal-800 p-6 text-white sm:p-7">
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
          <UserRound size={28} />

          <span
            className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-teal-800 ${
              currentMember.status === "offline"
                ? "bg-slate-400"
                : "bg-emerald-400"
            }`}
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-xl font-bold">
            {currentMember.name}
          </p>

          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                currentMember.status === "offline"
                  ? "bg-slate-300"
                  : "bg-emerald-400"
              }`}
            />

            <p className="text-sm text-teal-50">
              {statusText}
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Performance snapshot */}
    <div className="grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200">
      <div className="p-4 text-center">
        <p className="text-lg font-bold text-ink">
          {todayCompletedCount}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          Today
        </p>
      </div>

      <div className="p-4 text-center">
        <p className="text-lg font-bold text-ink">
          {earnings.length}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          Deliveries
        </p>
      </div>

      <div className="p-4 text-center">
        <p className="text-lg font-bold text-ink">
          {formatCurrency(monthEarnings)}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          This month
        </p>
      </div>
    </div>
  </div>

  {/* Account information */}
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-2">
      <h2 className="text-lg font-semibold text-ink">
        Account information
      </h2>

      <p className="mt-1 text-sm text-muted">
        Your registered delivery partner details.
      </p>
    </div>

    <div className="mt-4 divide-y divide-slate-100">
      {/* Phone */}
      <div className="flex items-center gap-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Phone size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">
            Registered phone
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-ink">
            {currentMember.phone || "Not provided"}
          </p>
        </div>
      </div>

      {/* Service area */}
      <div className="flex items-center gap-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <MapPin size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">
            Service area
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-ink">
            {currentMember.area ||
              "Assigned delivery area"}
          </p>
        </div>
      </div>

      {/* Account status */}
      <div className="flex items-center gap-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <CheckCircle2 size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">
            Account status
          </p>

          <p className="mt-1 text-sm font-semibold text-ink">
            {statusText}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass}`}
        >
          {statusText}
        </span>
      </div>
    </div>
  </div>

  {/* Earnings summary */}
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">
          Earnings overview
        </h2>

        <p className="mt-1 text-sm text-muted">
          Your delivery earnings at a glance.
        </p>
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Wallet size={20} />
      </div>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-xs text-muted">
          Today
        </p>

        <p className="mt-1 text-lg font-bold text-ink">
          {formatCurrency(todayEarnings)}
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-xs text-muted">
          This week
        </p>

        <p className="mt-1 text-lg font-bold text-ink">
          {formatCurrency(weekEarnings)}
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-xs text-muted">
          This month
        </p>

        <p className="mt-1 text-lg font-bold text-ink">
          {formatCurrency(monthEarnings)}
        </p>
      </div>
    </div>
  </div>

  {/* Partner access */}
  <div className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
        <UserRound size={19} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-ink">
          Partner access
        </h2>

        <p className="mt-1 text-sm leading-6 text-muted">
          Sign out of your delivery partner session
          on this device.
        </p>
      </div>
    </div>

    <button
      type="button"
      onClick={handleLogout}
      className="mt-5 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm active:scale-[0.98] sm:w-auto"
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
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
  <div className="mx-auto grid max-w-2xl grid-cols-5 px-2 sm:px-4">
    <button
      type="button"
      onClick={() => setActiveTab("home")}
      className={`group flex min-h-[64px] flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 ${
        activeTab === "home"
          ? "text-teal-700"
          : "text-slate-400 hover:text-slate-600"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
          activeTab === "home"
            ? "bg-teal-50 shadow-sm"
            : "bg-transparent group-hover:bg-slate-50"
        }`}
      >
        <Home size={19} />
      </div>

      <span
        className={`text-[11px] ${
          activeTab === "home"
            ? "font-bold"
            : "font-medium"
        }`}
      >
        Home
      </span>
    </button>

    <button
      type="button"
      onClick={() => setActiveTab("blocks")}
      className={`group flex min-h-[64px] flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 ${
        activeTab === "blocks"
          ? "text-teal-700"
          : "text-slate-400 hover:text-slate-600"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
          activeTab === "blocks"
            ? "bg-teal-50 shadow-sm"
            : "bg-transparent group-hover:bg-slate-50"
        }`}
      >
        <Zap size={19} />
      </div>

      <span
        className={`text-[11px] ${
          activeTab === "blocks"
            ? "font-bold"
            : "font-medium"
        }`}
      >
        Blocks
      </span>
    </button>

    <button
      type="button"
      onClick={() => setActiveTab("schedule")}
      className={`group flex min-h-[64px] flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 ${
        activeTab === "schedule"
          ? "text-teal-700"
          : "text-slate-400 hover:text-slate-600"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200 ${
          activeTab === "schedule"
            ? "bg-teal-700 text-white shadow-md shadow-teal-700/20"
            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
        }`}
      >
        <CalendarDays size={19} />
      </div>

      <span
        className={`text-[11px] ${
          activeTab === "schedule"
            ? "font-bold"
            : "font-medium"
        }`}
      >
        Schedule
      </span>
    </button>

    <button
      type="button"
      onClick={() => setActiveTab("earnings")}
      className={`group flex min-h-[64px] flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 ${
        activeTab === "earnings"
          ? "text-teal-700"
          : "text-slate-400 hover:text-slate-600"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
          activeTab === "earnings"
            ? "bg-teal-50 shadow-sm"
            : "bg-transparent group-hover:bg-slate-50"
        }`}
      >
        <Wallet size={19} />
      </div>

      <span
        className={`text-[11px] ${
          activeTab === "earnings"
            ? "font-bold"
            : "font-medium"
        }`}
      >
        Earnings
      </span>
    </button>

    <button
      type="button"
      onClick={() => setActiveTab("profile")}
      className={`group flex min-h-[64px] flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 ${
        activeTab === "profile"
          ? "text-teal-700"
          : "text-slate-400 hover:text-slate-600"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
          activeTab === "profile"
            ? "bg-teal-50 shadow-sm"
            : "bg-transparent group-hover:bg-slate-50"
        }`}
      >
        <UserRound size={19} />
      </div>

      <span
        className={`text-[11px] ${
          activeTab === "profile"
            ? "font-bold"
            : "font-medium"
        }`}
      >
        Profile
      </span>
    </button>
  </div>
</nav>
    </div>
  );
}