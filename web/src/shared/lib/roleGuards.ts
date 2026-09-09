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

// Business roles may move pickup orders only through the server-approved pipeline.
export function allowedTransitions(role: Role | undefined, status: OrderStatus): OrderStatus[] {
  if (!role) return [];
  const base: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["CONFIRMED", "REJECTED"],
    CONFIRMED: ["PREPARING"],
    PREPARING: ["READY_FOR_PICKUP"],
    READY_FOR_PICKUP: ["COMPLETED"],
    COMPLETED: [],
    REJECTED: [],
    CANCELLED: [],
  };
  if (role === "BUSINESS_OWNER" || role === "STAFF" || role === "CASHIER") return base[status];
  return [];
}
