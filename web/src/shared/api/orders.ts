import { http } from "./axios";
import type { Order, OrderStatus, Storefront, StorefrontSummary } from "@/shared/types/orders";

export type OrderFilters = {
  status?: OrderStatus;
  search?: string;
  from?: string;
  to?: string;
};

export async function listOrders(filters: OrderFilters = {}): Promise<Order[]> {
  const params: Record<string, string> = {};
  if (filters.status) params.status = filters.status;
  if (filters.search) params.search = filters.search;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  const { data } = await http.get<{ items: Order[] }>("/orders", { params });
  return data.items;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await http.get<Order>(`/orders/${id}`);
  return data;
}

export async function transitionOrder(
  id: string,
  next: OrderStatus,
  note?: string,
): Promise<Order> {
  const { data } = await http.post<Order>(`/orders/${id}/transition`, { next, note });
  return data;
}

export async function listStorefronts(): Promise<StorefrontSummary[]> {
  const { data } = await http.get<{ items: StorefrontSummary[] }>("/storefronts");
  return data.items;
}

export async function getStorefront(slug: string): Promise<Storefront> {
  const { data } = await http.get<Storefront>(`/storefronts/${encodeURIComponent(slug)}`);
  return data;
}

export type PlaceOrderPayload = {
  items: { productId: string; quantity: number }[];
  idempotencyKey: string;
};

export async function placeCustomerOrder(payload: PlaceOrderPayload): Promise<Order> {
  const { idempotencyKey, ...body } = payload;
  const { data } = await http.post<Order>("/customer/orders", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return data;
}

export async function listCustomerOrders(): Promise<Order[]> {
  const { data } = await http.get<{ items: Order[] }>("/customer/orders");
  return data.items;
}

export async function cancelCustomerOrder(id: string, note?: string): Promise<Order> {
  const { data } = await http.post<Order>(`/customer/orders/${id}/cancel`, { note });
  return data;
}

export async function chooseCustomerBalanceMethod(id: string, method: Order["balanceCollectionMethod"]): Promise<Order> {
  const { data } = await http.patch<Order>(`/customer/orders/${id}/balance-method`, { method });
  return data;
}

export async function collectOrderCounterPayment(id: string, amountMinor: number, referenceNumber: string): Promise<Order> {
  const { data } = await http.post<Order>(`/orders/${id}/counter-payments`, { amountMinor, referenceNumber });
  return data;
}

export async function recordOrderRefund(id: string, method: "GCASH" | "MAYA" | "CASH", amountMinor: number, referenceNumber: string): Promise<Order> {
  const { data } = await http.post<Order>(`/orders/${id}/refund`, { method, amountMinor, referenceNumber, refundConfirmed: true });
  return data;
}
