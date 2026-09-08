import type { Role } from "@/shared/types/auth";
import type { OrderStatus } from "@/shared/types/orders";

export function isAdmin(role: Role | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "BUSINESS_OWNER";
}

export function canEditCatalog(role: Role | undefined): boolean {
  return role === "BUSINESS_OWNER" || role === "STAFF";
}

export function canAdjustInventory(role: Role | undefined): boolean {
  return role === "BUSINESS_OWNER" || role === "STAFF";
}

export function canManageUsers(role: Role | undefined): boolean {
  return role === "BUSINESS_OWNER";
}

export function canManageSettings(role: Role | undefined): boolean {
  return role === "BUSINESS_OWNER";
}

export function canViewReports(role: Role | undefined): boolean {
  return role === "BUSINESS_OWNER";
}

export function canApplyLineDiscount(role: Role | undefined): boolean {
  return role === "BUSINESS_OWNER";
}

// Order transition matrix — what each role may set from each status.
// Both roles can move pipeline forward; admin has more rights for cancel/reject.
export function allowedTransitions(role: Role | undefined, status: OrderStatus): OrderStatus[] {
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
  if (role === "BUSINESS_OWNER") return base[status];
  if (role === "STAFF" || role === "CASHIER") return cashierMask[status];
  return [];
}
