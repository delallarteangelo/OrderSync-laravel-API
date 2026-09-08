import { create } from "zustand";
import type { User, Role } from "@/shared/types/auth";
import { adminUser, cashierUser, mockUsers } from "@/mock/mockUsers";
import { usePosCartStore } from "./posCartStore";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  bootstrapped: boolean;
  setSession: (s: { accessToken: string; user: User }) => void;
  clear: () => void;
  markBootstrapped: () => void;
  /** @deprecated demo helper retained for transition */
  signIn: (role: Role) => void;
  /** @deprecated */
  signOut: () => void;
  /** @deprecated */
  switchRole: (role: Role) => void;
};

function syncCartTenant(user: User | null) {
  usePosCartStore.getState().setBusiness(user?.business?.id ?? null);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  bootstrapped: false,
  setSession: ({ accessToken, user }) => {
    syncCartTenant(user);
    set({ accessToken, user });
  },
  clear: () => {
    syncCartTenant(null);
    set({ accessToken: null, user: null });
  },
  markBootstrapped: () => set({ bootstrapped: true }),
  signIn: (role) => {
    const user = role === "BUSINESS_OWNER" ? adminUser : cashierUser;
    syncCartTenant(user);
    set({ user, accessToken: "demo-token" });
  },
  signOut: () => {
    syncCartTenant(null);
    set({ user: null, accessToken: null });
  },
  switchRole: (role) => {
    const user = role === "BUSINESS_OWNER" ? adminUser : cashierUser;
    syncCartTenant(user);
    set({ user });
  },
}));

export { mockUsers };
