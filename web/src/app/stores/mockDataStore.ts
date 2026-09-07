import { create } from "zustand";
import type { Product, Category } from "@/shared/types/catalog";
import type { Order, OrderStatus, OrderStatusEvent } from "@/shared/types/orders";
import type { User } from "@/shared/types/auth";
import type {
  InventoryMovement,
  ReasonCode,
  RestockEntry,
  StockAdjustment,
} from "@/shared/types/inventory";
import type { BusinessSettings } from "@/shared/types/settings";
import type { PosSale } from "@/shared/types/pos";
import { mockProducts } from "@/mock/mockProducts";
import { mockCategories } from "@/mock/mockCategories";
import { mockOrders } from "@/mock/mockOrders";
import { mockUsers } from "@/mock/mockUsers";
import { mockMovements } from "@/mock/mockMovements";
import { mockSettings } from "@/mock/mockSettings";
import { mockPosSales } from "@/mock/mockPosSales";

type State = {
  products: Product[];
  categories: Category[];
  orders: Order[];
  users: User[];
  movements: InventoryMovement[];
  settings: BusinessSettings;
  posSales: PosSale[];

  // Catalog
  upsertProduct: (p: Product) => void;
  deactivateProduct: (id: string) => void;
  reactivateProduct: (id: string) => void;
  upsertCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;

  // Inventory
  adjustStock: (entry: StockAdjustment, actor: { id: string; name: string }) => void;
  restock: (entries: RestockEntry[], actor: { id: string; name: string }) => void;

  // Orders
  setOrderStatus: (
    id: string,
    next: OrderStatus,
    actor: { id: string; name: string },
    note?: string,
  ) => void;

  // Users
  upsertUser: (u: User) => void;
  deactivateUser: (id: string) => void;

  // Settings
  updateSettings: (s: BusinessSettings) => void;

  // POS
  finalizeSale: (sale: PosSale) => void;
};

function recordMovement(
  state: State,
  productId: string,
  delta: number,
  reason: ReasonCode,
  actor: { id: string; name: string },
  note?: string,
): InventoryMovement[] {
  const product = state.products.find((p) => p.id === productId);
  return [
    {
      id: `mv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId,
      productName: product?.name ?? productId,
      delta,
      reason,
      note,
      actorId: actor.id,
      actorName: actor.name,
      occurredAt: new Date().toISOString(),
    },
    ...state.movements,
  ];
}

export const useMockDataStore = create<State>((set, get) => ({
  products: mockProducts,
  categories: mockCategories,
  orders: mockOrders,
  users: mockUsers,
  movements: mockMovements,
  settings: mockSettings,
  posSales: mockPosSales,

  upsertProduct: (p) =>
    set((s) => {
      const exists = s.products.some((x) => x.id === p.id);
      return {
        products: exists
          ? s.products.map((x) => (x.id === p.id ? p : x))
          : [{ ...p, id: p.id || `p-${Date.now()}` }, ...s.products],
      };
    }),
  deactivateProduct: (id) =>
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, isActive: false } : p)),
    })),
  reactivateProduct: (id) =>
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, isActive: true } : p)),
    })),
  upsertCategory: (c) =>
    set((s) => {
      const exists = s.categories.some((x) => x.id === c.id);
      return {
        categories: exists
          ? s.categories.map((x) => (x.id === c.id ? c : x))
          : [...s.categories, { ...c, id: c.id || `cat-${Date.now()}` }],
      };
    }),
  deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

  adjustStock: (entry, actor) =>
    set((s) => {
      const products = s.products.map((p) =>
        p.id === entry.productId
          ? { ...p, stockOnHand: Math.max(0, p.stockOnHand + entry.delta) }
          : p,
      );
      const movements = recordMovement(
        { ...s, products } as State,
        entry.productId,
        entry.delta,
        entry.reasonCode,
        actor,
        entry.note,
      );
      return { products, movements };
    }),

  restock: (entries, actor) =>
    set((s) => {
      let products = s.products;
      let movements = s.movements;
      entries.forEach((e) => {
        products = products.map((p) =>
          p.id === e.productId ? { ...p, stockOnHand: p.stockOnHand + e.quantity } : p,
        );
        movements = recordMovement(
          { ...s, products, movements } as State,
          e.productId,
          e.quantity,
          "RESTOCK",
          actor,
          e.note ?? (e.supplierRef ? `Supplier: ${e.supplierRef}` : undefined),
        );
      });
      return { products, movements };
    }),

  setOrderStatus: (id, next, actor, note) =>
    set((s) => {
      const orders = s.orders.map((o) => {
        if (o.id !== id) return o;
        const event: OrderStatusEvent = {
          status: next,
          at: new Date().toISOString(),
          actorName: actor.name,
          note,
        };
        return {
          ...o,
          status: next,
          updatedAt: event.at,
          statusHistory: [...o.statusHistory, event],
        };
      });

      // If confirming, deduct stock + record movements
      if (next === "CONFIRMED") {
        const order = s.orders.find((o) => o.id === id);
        if (order) {
          let products = s.products;
          let movements = s.movements;
          order.items.forEach((it) => {
            products = products.map((p) =>
              p.id === it.productId
                ? { ...p, stockOnHand: Math.max(0, p.stockOnHand - it.quantity) }
                : p,
            );
            movements = recordMovement(
              { ...s, products, movements } as State,
              it.productId,
              -it.quantity,
              "ORDER_CONFIRMED",
              actor,
              `Order ${order.code}`,
            );
          });
          return { orders, products, movements };
        }
      }
      return { orders };
    }),

  upsertUser: (u) =>
    set((s) => {
      const exists = s.users.some((x) => x.id === u.id);
      return {
        users: exists
          ? s.users.map((x) => (x.id === u.id ? u : x))
          : [...s.users, { ...u, id: u.id || `u-${Date.now()}` }],
      };
    }),
  deactivateUser: (id) =>
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, isActive: false } : u)),
    })),

  updateSettings: (next) => set({ settings: next }),

  finalizeSale: (sale) =>
    set((s) => {
      let products = s.products;
      let movements = s.movements;
      sale.lines.forEach((l) => {
        products = products.map((p) =>
          p.id === l.productId ? { ...p, stockOnHand: Math.max(0, p.stockOnHand - l.quantity) } : p,
        );
        movements = recordMovement(
          { ...s, products, movements } as State,
          l.productId,
          -l.quantity,
          "POS_SALE",
          { id: sale.cashierId, name: sale.cashierName },
          `Receipt ${sale.receiptNumber}`,
        );
      });
      return { products, movements, posSales: [sale, ...s.posSales] };
    }),
}));

// Selectors
export const selectLowStock = (s: State) =>
  s.products.filter((p) => p.isActive && p.stockOnHand <= p.lowStockThreshold);
export const selectCategoryName = (s: State, id: string) =>
  s.categories.find((c) => c.id === id)?.name ?? id;
