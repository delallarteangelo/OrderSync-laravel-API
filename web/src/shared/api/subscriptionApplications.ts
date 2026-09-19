import { http } from "./axios";
import type { BillingRecord, SubscriptionPlan } from "@/shared/types/platform";
import type { RecordedPayment, WalletMethod } from "@/shared/types/payments";

export type PlatformWallet = {
  id: string;
  method: WalletMethod;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
};

export type SubscriptionApplication = {
  id: string;
  businessId: string;
  businessName: string;
  kind: "INITIAL" | "UPGRADE";
  status:
    | "PENDING_REVIEW"
    | "AWAITING_PAYMENT"
    | "PAYMENT_SUBMITTED"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";
  desiredPlan: SubscriptionPlan;
  fromPlan: SubscriptionPlan | null;
  amountDueMinor: number;
  periodEndSnapshot: string | null;
  quoteExpiresAt: string | null;
  rejectionReason: string | null;
  bill: BillingRecord | null;
  payments: RecordedPayment[];
  owner: { name: string; email: string } | null;
  createdAt: string;
};

export async function publicSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await http.get<{ plans: SubscriptionPlan[] }>("/subscription-plans", {
    _skipRefresh: true,
  });
  return data.plans;
}

export async function resumeBusinessApplication(ownerEmail: string, password: string) {
  const { data } = await http.post<{ id: string; applicationToken: string }>(
    "/business-registrations/resume",
    { ownerEmail, password },
    { _skipRefresh: true },
  );
  return data;
}

export async function getBusinessApplication(id: string, token: string) {
  const { data } = await http.get<{
    application: SubscriptionApplication;
    wallets: PlatformWallet[];
  }>(`/business-registrations/${id}/status`, {
    headers: { "X-Application-Token": token },
    _skipRefresh: true,
  });
  return data;
}

export async function submitBusinessApplicationPayment(
  id: string,
  token: string,
  method: WalletMethod,
  referenceNumber: string,
  proof: File,
) {
  const form = new FormData();
  form.set("method", method);
  form.set("referenceNumber", referenceNumber);
  form.set("proof", proof);
  const { data } = await http.post<{ application: SubscriptionApplication }>(
    `/business-registrations/${id}/payments`,
    form,
    { headers: { "X-Application-Token": token }, _skipRefresh: true },
  );
  return data.application;
}

export async function listTenantApplications() {
  const { data } = await http.get<{ items: SubscriptionApplication[] }>(
    "/tenant/subscription-requests",
  );
  return data.items;
}

export async function requestTenantUpgrade(planCode: "STANDARD" | "PREMIUM") {
  const { data } = await http.post<SubscriptionApplication>("/tenant/subscription-requests", {
    planCode,
  });
  return data;
}

export async function cancelTenantUpgrade(id: string) {
  const { data } = await http.post<SubscriptionApplication>(
    `/tenant/subscription-requests/${id}/cancel`,
  );
  return data;
}

export async function listTenantPlatformWallets() {
  const { data } = await http.get<{ items: PlatformWallet[] }>("/tenant/platform-wallets");
  return data.items;
}

export async function listPlatformApplications() {
  const { data } = await http.get<{ items: SubscriptionApplication[] }>(
    "/platform/subscription-requests",
  );
  return data.items;
}

export async function reviewPlatformApplication(
  id: string,
  decision: "APPROVE" | "REJECT",
  reason?: string,
) {
  const { data } = await http.post<SubscriptionApplication>(
    `/platform/subscription-requests/${id}/review`,
    { decision, reason },
  );
  return data;
}

export async function listPlatformWallets() {
  const { data } = await http.get<{ items: PlatformWallet[] }>("/platform/wallets");
  return data.items;
}

export async function savePlatformWallet(
  method: WalletMethod,
  accountName: string,
  accountNumber: string,
  isActive: boolean,
) {
  const { data } = await http.put<PlatformWallet>(`/platform/wallets/${method}`, {
    accountName,
    accountNumber,
    isActive,
  });
  return data;
}
