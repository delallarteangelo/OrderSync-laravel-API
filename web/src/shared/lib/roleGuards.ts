import type { Role } from "@/shared/types/auth";
import type { OrderStatus } from "@/shared/types/orders";

export function isAdmin(role: Role | undefined): boolean {
  return role === "ADMIN";
}

export function canEditCatalog(role: Role | undefined): boolean {
  return role === "ADMIN";
}

export function canManageUsers(role: Role | undefined): boolean {
  return role === "ADMIN";
}

export function canManageSettings(role: Role | undefined): boolean {
  return role === "ADMIN";
}

export function canViewReports(role: Role | undefined): boolean {
  return role === "ADMIN";
}

export function canApplyLineDiscount(role: Role | undefined): boolean {
  return role === "ADMIN";
}

// Order transition matrix — what each role may set from each status.
// Both roles can move pipeline forward; admin has more rights for cancel/reject.
export function allowedTransitions(
  role: Role | undefined,
  status: OrderStatus,
): OrderStatus[] {
  if (!role) return [];
  const base: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["CONFIRMED", "REJECTED"],
    CONFIRMED: ["PREPARING", "CANCELLED"],
    PREPARING: ["READY_FOR_PICKUP", "CANCELLED"],
    READY_FOR_PICKUP: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    REJECTED: [],
    CANCELLED: [],
  };
  const cashierMask: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["CONFIRMED", "REJECTED"],
    CONFIRMED: ["PREPARING"],
    PREPARING: ["READY_FOR_PICKUP"],
    READY_FOR_PICKUP: ["COMPLETED"],
    COMPLETED: [],
    REJECTED: [],
    CANCELLED: [],
  };
  return role === "ADMIN" ? base[status] : cashierMask[status];
}
