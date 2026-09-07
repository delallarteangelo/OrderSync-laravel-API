export type ReasonCode = "POS_SALE" | "ORDER_CONFIRMED" | "ADJUSTMENT" | "RESTOCK";

export type InventoryMovement = {
  id: string;
  productId: string;
  productName: string;
  delta: number;
  reason: ReasonCode;
  note?: string;
  actorId: string;
  actorName: string;
  occurredAt: string;
};

export type StockAdjustment = {
  productId: string;
  delta: number;
  reasonCode: ReasonCode;
  note?: string;
};

export type RestockEntry = {
  productId: string;
  quantity: number;
  supplierRef?: string;
  note?: string;
};
