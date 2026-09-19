import { http } from "./axios";
import type { BillingRecord } from "@/shared/types/platform";
import type {
  PaymentInstruction,
  PaymentReceipt,
  RecordedPayment,
  RecordedPaymentStatus,
  WalletMethod,
} from "@/shared/types/payments";

type PaymentList = {
  items: RecordedPayment[];
  meta?: { currentPage: number; lastPage: number; total: number };
};

export async function listCustomerPaymentInstructions(): Promise<PaymentInstruction[]> {
  const { data } = await http.get<{ items: PaymentInstruction[] }>(
    "/customer/payment-instructions",
  );
  return data.items;
}

export async function listBusinessPaymentInstructions(): Promise<PaymentInstruction[]> {
  const { data } = await http.get<{ items: PaymentInstruction[] }>("/payment-instructions");
  return data.items;
}

export async function savePaymentInstruction(
  method: WalletMethod,
  input: Omit<PaymentInstruction, "id" | "method" | "qrAvailable">,
  qr?: File,
): Promise<PaymentInstruction> {
  const form = new FormData();
  form.set("accountName", input.accountName);
  form.set("accountNumber", input.accountNumber);
  form.set("instructions", input.instructions ?? "");
  form.set("active", input.active ? "1" : "0");
  if (qr) form.set("qr", qr);
  const { data } = await http.post<PaymentInstruction>(`/payment-instructions/${method}`, form);
  return data;
}

export async function submitOrderPayment(
  orderId: string,
  method: WalletMethod,
  referenceNumber: string,
  proof: File,
  claimedAmountMinor?: number,
): Promise<RecordedPayment> {
  const form = new FormData();
  form.set("method", method);
  form.set("referenceNumber", referenceNumber);
  form.set("proof", proof);
  if (claimedAmountMinor !== undefined) form.set("claimedAmountMinor", String(claimedAmountMinor));
  const { data } = await http.post<RecordedPayment>(`/customer/orders/${orderId}/payments`, form);
  return data;
}

export async function listBusinessPayments(): Promise<RecordedPayment[]> {
  const { data } = await http.get<PaymentList>("/payments");
  return data.items;
}

export async function listPlatformPayments(): Promise<RecordedPayment[]> {
  const { data } = await http.get<PaymentList>("/platform/payments");
  return data.items;
}

export async function reviewPayment(
  id: string,
  decision: Extract<RecordedPaymentStatus, "VERIFIED" | "REJECTED">,
  platform: boolean,
  reason?: string,
  walletReceiptConfirmed?: boolean,
  verifiedAmountMinor?: number,
): Promise<RecordedPayment> {
  const path = platform ? `/platform/payments/${id}/review` : `/payments/${id}/review`;
  const { data } = await http.post<RecordedPayment>(path, {
    decision,
    reason,
    walletReceiptConfirmed,
    verifiedAmountMinor,
  });
  return data;
}

export async function listTenantBillingRecords(): Promise<
  Array<BillingRecord & { payments: RecordedPayment[] }>
> {
  const { data } = await http.get<{
    items: Array<BillingRecord & { payments: RecordedPayment[] }>;
  }>("/tenant/billing-records");
  return data.items;
}

export async function submitSubscriptionPayment(
  billingRecordId: string,
  method: WalletMethod,
  referenceNumber: string,
  proof: File,
): Promise<RecordedPayment> {
  const form = new FormData();
  form.set("method", method);
  form.set("referenceNumber", referenceNumber);
  form.set("proof", proof);
  const { data } = await http.post<RecordedPayment>(
    `/tenant/billing-records/${billingRecordId}/payments`,
    form,
  );
  return data;
}

export async function getPaymentReceipt(
  payment: RecordedPayment,
  audience: "customer" | "business" | "tenant" | "platform",
): Promise<PaymentReceipt> {
  const prefix = audience === "business" ? "" : `/${audience}`;
  const { data } = await http.get<PaymentReceipt>(`${prefix}/payments/${payment.id}/receipt`);
  return data;
}

export async function openPrivatePaymentFile(path: string, filename: string): Promise<void> {
  const { data } = await http.get<Blob>(path, { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function getPrivatePaymentFile(path: string): Promise<Blob> {
  const { data } = await http.get<Blob>(path, { responseType: "blob" });
  return data;
}

export async function getBusinessPaymentProof(id: string): Promise<Blob> {
  const { data } = await http.get<Blob>(`/payments/${id}/proof`, { responseType: "blob" });
  return data;
}
