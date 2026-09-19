import type { Order } from "@/lib/types";

export type DeliveryPartnerStatus =
  | "available"
  | "assigned"
  | "out-on-delivery"
  | "offline";

export type DeliveryMember = {
  id: string;
  name: string;
  phone: string;
  status: DeliveryPartnerStatus;
  area: string;
  assignedOrder?: string;
};

export type DeliveryAssignment = {
  memberId: string;
  memberName: string;
  memberPhone: string;
};

const MEMBERS_KEY = "nexora-delivery-members";
const ASSIGNMENTS_KEY = "nexora-order-delivery";

export function getDeliveryMembers(): DeliveryMember[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(MEMBERS_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getDeliveryAssignments(): Record<
  string,
  DeliveryAssignment
> {
  if (typeof window === "undefined") return {};

  try {
    const saved = localStorage.getItem(ASSIGNMENTS_KEY);

    if (!saved) return {};

    const parsed = JSON.parse(saved);

    return parsed && typeof parsed === "object"
      ? parsed
      : {};
  } catch {
    return {};
  }
}

/**
 * Automatically chooses a delivery partner.
 *
 * Priority:
 * 1. Available partner
 * 2. Matching delivery area
 * 3. Partner with the fewest active deliveries
 */
export function findBestDeliveryPartner(
  order: Order,
  members: DeliveryMember[],
  assignments: Record<string, DeliveryAssignment>,
): DeliveryMember | null {
  const availablePartners = members.filter(
    (member) => member.status === "available",
  );

  if (availablePartners.length === 0) {
    return null;
  }

  const deliveryArea =
    getOrderDeliveryArea(order).toLowerCase();

  const scoredPartners = availablePartners.map(
    (member) => {
      const activeOrders = Object.values(
        assignments,
      ).filter(
        (assignment) =>
          assignment.memberId === member.id,
      ).length;

      const areaMatches =
        deliveryArea.length > 0 &&
        member.area
          .toLowerCase()
          .includes(deliveryArea);

      let score = 0;

      if (areaMatches) {
        score += 100;
      }

      // Prefer partners carrying fewer orders.
      score -= activeOrders * 10;

      return {
        member,
        score,
        activeOrders,
      };
    },
  );

  scoredPartners.sort(
    (a, b) => b.score - a.score,
  );

  return scoredPartners[0]?.member ?? null;
}

/**
 * Keeps the area logic isolated so we can improve it later
 * with maps/GPS without changing the dispatch engine.
 */
function getOrderDeliveryArea(order: Order): string {
  const possibleOrder = order as Order & {
    deliveryAddress?: {
      area?: string;
      city?: string;
    };
    address?: {
      area?: string;
      city?: string;
    };
  };

  return (
    possibleOrder.deliveryAddress?.area ??
    possibleOrder.deliveryAddress?.city ??
    possibleOrder.address?.area ??
    possibleOrder.address?.city ??
    ""
  );
}