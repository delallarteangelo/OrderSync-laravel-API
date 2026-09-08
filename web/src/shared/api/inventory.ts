import { http } from "./axios";
import type {
  InventoryMovement,
  ReasonCode,
  RestockEntry,
  StockAdjustment,
} from "@/shared/types/inventory";
import type { Product } from "@/shared/types/catalog";

export type LowStockItem = {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  stockOnHand: number;
  threshold: number;
  status?: "OPEN" | "RESOLVED";
  openedAt?: string;
};

export async function listInventory(): Promise<Product[]> {
  const { data } = await http.get<{ items: Product[] }>("/inventory");
  return data.items;
}

export async function listLowStock(): Promise<LowStockItem[]> {
  const { data } = await http.get<{ items: LowStockItem[] }>("/inventory/low-stock");
  return data.items;
}

export type MovementFilters = {
  productId?: string;
  reason?: ReasonCode;
  from?: string;
  to?: string;
};

export async function listMovements(filters: MovementFilters = {}): Promise<InventoryMovement[]> {
  const params: Record<string, string> = {};
  if (filters.productId) params.productId = filters.productId;
  if (filters.reason) params.reason = filters.reason;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  const { data } = await http.get<{ items: InventoryMovement[] }>("/inventory/movements", {
    params,
  });
  return data.items;
}

export async function adjustStock(
  payload: StockAdjustment,
): Promise<{ product: Product; movement: InventoryMovement }> {
  const { data } = await http.post("/inventory/adjust", payload);
  return data;
}

export async function restock(
  entries: RestockEntry[],
): Promise<{ movements: InventoryMovement[] }> {
  const { data } = await http.post("/inventory/restock", { entries });
  return data;
}
