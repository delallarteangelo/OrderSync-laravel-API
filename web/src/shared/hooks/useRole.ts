import { useAuthStore } from "@/app/stores/authStore";

export function useRole() {
  const role = useAuthStore((s) => s.user?.role);
  return {
    role,
    isSuperAdmin: role === "SUPER_ADMIN",
    isBusinessOwner: role === "BUSINESS_OWNER",
    canManageBusiness: role === "BUSINESS_OWNER",
    canManageCatalog: role === "BUSINESS_OWNER" || role === "STAFF",
    canManageInventory: role === "BUSINESS_OWNER" || role === "STAFF",
    isAdmin: role === "BUSINESS_OWNER",
    isStaff: role === "STAFF",
    isCashier: role === "CASHIER",
    isCustomer: role === "CUSTOMER",
  };
}
