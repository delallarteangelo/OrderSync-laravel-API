import { http } from "./axios";
import type { CartLine, PaymentMethod, PosSale } from "@/shared/types/pos";

export async function listSales(): Promise<PosSale[]> {
  const { data } = await http.get<{ items: PosSale[] }>("/pos/sales");
  return data.items;
}

export type FinalizeSalePayload = {
  lines: CartLine[];
  paymentMethod: PaymentMethod;
  tendered?: number;
  discountTotal?: number;
};

export async function finalizeSale(payload: FinalizeSalePayload): Promise<PosSale> {
  const { data } = await http.post<PosSale>("/pos/sales", payload);
  return data;
}
