export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED";

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderStatusEvent = {
  status: OrderStatus;
  at: string;
  actorName: string;
  note?: string;
};

export type Order = {
  id: string;
  code: string;
  customer: { id: string; name: string; phone?: string };
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
  statusHistory: OrderStatusEvent[];
};
