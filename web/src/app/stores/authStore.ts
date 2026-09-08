import { create } from "zustand";
import type { User, Role } from "@/shared/types/auth";
import { adminUser, cashierUser, mockUsers } from "@/mock/mockUsers";

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  bootstrapped: false,
  setSession: ({ accessToken, user }) => set({ accessToken, user }),
  clear: () => set({ accessToken: null, user: null }),
  markBootstrapped: () => set({ bootstrapped: true }),
  signIn: (role) =>
    set({ user: role === "BUSINESS_OWNER" ? adminUser : cashierUser, accessToken: "demo-token" }),
  signOut: () => set({ user: null, accessToken: null }),
  switchRole: (role) => set({ user: role === "BUSINESS_OWNER" ? adminUser : cashierUser }),
}));

export { mockUsers };
