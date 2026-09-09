import { z } from "zod";
import type { RecordedPayment } from "@/shared/types/payments";

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "CANCELLED",
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export type OrderItem = {
  productId: string;
  sku: string;
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
  business: { id: string; name: string; slug: string };
  customer: { id: string | null; name: string; email: string };
  items: OrderItem[];
  subtotal: number;
  total: number;
  fulfillmentMethod: "PICKUP";
  status: OrderStatus;
  placedAt: string;
  updatedAt: string;
  statusHistory: OrderStatusEvent[];
  payments: RecordedPayment[];
};

export type StorefrontSummary = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  fulfillmentMethod: "PICKUP";
};

export type StorefrontCategory = { id: string; name: string };

export type StorefrontProduct = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  price: number;
  stockOnHand: number;
  imageUrl: string | null;
};

export type Storefront = {
  business: StorefrontSummary;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
};
