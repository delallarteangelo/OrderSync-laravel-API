import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartLine } from "@/shared/types/pos";
import type { Product } from "@/shared/types/catalog";

type PosCartState = {
  businessId: string | null;
  lines: CartLine[];
  setBusiness: (businessId: string | null) => void;
  addProduct: (p: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  setDiscount: (productId: string, discount: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const usePosCartStore = create<PosCartState>()(
  persist(
    (set, get) => ({
      businessId: null,
      lines: [],
      setBusiness: (businessId) =>
        set((state) => (state.businessId === businessId ? state : { businessId, lines: [] })),
      addProduct: (p, qty = 1) => {
        const existing = get().lines.find((l) => l.productId === p.id);
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.productId === p.id ? { ...l, quantity: l.quantity + qty } : l,
            ),
          });
        } else {
          set({
            lines: [
              ...get().lines,
              {
                productId: p.id,
                sku: p.sku,
                name: p.name,
                unitPrice: p.price,
                quantity: qty,
              },
            ],
          });
        }
      },
      setQty: (productId, qty) =>
        set({
          lines: get().lines.map((l) =>
            l.productId === productId ? { ...l, quantity: Math.max(1, qty) } : l,
          ),
        }),
      setDiscount: (productId, discount) =>
        set({
          lines: get().lines.map((l) =>
            l.productId === productId ? { ...l, lineDiscount: Math.max(0, discount) } : l,
          ),
        }),
      remove: (productId) => set({ lines: get().lines.filter((l) => l.productId !== productId) }),
      clear: () => set({ lines: [] }),
    }),
    { name: "pos-cart-draft", storage: createJSONStorage(() => sessionStorage) },
  ),
);
