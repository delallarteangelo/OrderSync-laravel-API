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
  paymentReference?: string;
  idempotencyKey: string;
};

export async function finalizeSale(payload: FinalizeSalePayload): Promise<PosSale> {
  const { idempotencyKey, ...body } = payload;
  const { data } = await http.post<PosSale>("/pos/sales", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return data;
}

export async function getSale(id: string): Promise<PosSale> {
  const { data } = await http.get<PosSale>(`/pos/sales/${id}`);
  return data;
}
