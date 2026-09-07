import { http } from "./axios";
import type { Order, OrderStatus } from "@/shared/types/orders";

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

export async function transitionOrder(id: string, next: OrderStatus, note?: string): Promise<Order> {
  const { data } = await http.post<Order>(`/orders/${id}/transition`, { next, note });
  return data;
}
