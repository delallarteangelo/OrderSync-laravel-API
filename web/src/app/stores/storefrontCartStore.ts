import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StorefrontProduct } from "@/shared/types/orders";

export type StorefrontCartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  stockOnHand: number;
};

type StorefrontCartState = {
  businessSlug: string | null;
  lines: StorefrontCartLine[];
  setBusiness: (slug: string | null) => void;
  add: (product: StorefrontProduct) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const useStorefrontCartStore = create<StorefrontCartState>()(
  persist(
    (set, get) => ({
      businessSlug: null,
      lines: [],
      setBusiness: (businessSlug) =>
        set((state) => (state.businessSlug === businessSlug ? state : { businessSlug, lines: [] })),
      add: (product) => {
        const existing = get().lines.find((line) => line.productId === product.id);
        if (existing) {
          set({
            lines: get().lines.map((line) =>
              line.productId === product.id
                ? { ...line, quantity: Math.min(line.quantity + 1, product.stockOnHand) }
                : line,
            ),
          });
          return;
        }
        set({
          lines: [
            ...get().lines,
            {
              productId: product.id,
              name: product.name,
              unitPrice: product.price,
              quantity: 1,
              stockOnHand: product.stockOnHand,
            },
          ],
        });
      },
      setQuantity: (productId, quantity) =>
        set({
          lines: get().lines.map((line) =>
            line.productId === productId
              ? { ...line, quantity: Math.max(1, Math.min(quantity, line.stockOnHand)) }
              : line,
          ),
        }),
      remove: (productId) =>
        set({ lines: get().lines.filter((line) => line.productId !== productId) }),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "storefront-cart-draft",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ businessSlug: state.businessSlug, lines: state.lines }),
    },
  ),
);
