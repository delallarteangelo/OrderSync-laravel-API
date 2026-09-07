import { useAuthStore } from "@/app/stores/authStore";

export function useRole() {
  const role = useAuthStore((s) => s.user?.role);
  return {
    role,
    isAdmin: role === "ADMIN",
    isCashier: role === "CASHIER",
  };
}
