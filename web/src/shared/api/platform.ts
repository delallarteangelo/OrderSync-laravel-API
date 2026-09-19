import { http } from "./axios";
import type {
  BillingRecord,
  BusinessStatus,
  Paginated,
  PlanCode,
  PlatformBusiness,
  PlatformDashboard,
  PlatformUser,
  Subscription,
  SubscriptionPlan,
} from "@/shared/types/platform";

export type PlatformListDirection = "asc" | "desc";

export type PlatformBusinessListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: BusinessStatus;
  planCode?: PlanCode | "UNASSIGNED";
  sort?: "name" | "status" | "planCode" | "userCount" | "periodEnd" | "createdAt";
  direction?: PlatformListDirection;
};

export type PlatformUserListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  access?: "SUPER_ADMIN" | "TENANT";
  membershipRole?: "BUSINESS_OWNER" | "STAFF" | "CASHIER" | "CUSTOMER";
  sort?: "fullName" | "email" | "access" | "membershipsCount" | "isActive" | "createdAt";
  direction?: PlatformListDirection;
};

export async function getPlatformDashboard(): Promise<PlatformDashboard> {
  const { data } = await http.get<PlatformDashboard>("/platform/dashboard");
  return data;
}

export async function listPlatformBusinesses(
  params: PlatformBusinessListParams = {},
): Promise<Paginated<PlatformBusiness>> {
  const { data } = await http.get<Paginated<PlatformBusiness>>("/platform/businesses", { params });
  return data;
}

export async function approveBusiness(id: string): Promise<PlatformBusiness> {
  const { data } = await http.post<{ business: PlatformBusiness }>(
    `/platform/businesses/${id}/approve`,
  );
  return data.business;
}

export async function suspendBusiness(id: string, reason: string): Promise<PlatformBusiness> {
  const { data } = await http.post<{ business: PlatformBusiness }>(
    `/platform/businesses/${id}/suspend`,
    { reason },
  );
  return data.business;
}

export async function reactivateBusiness(id: string): Promise<PlatformBusiness> {
  const { data } = await http.post<{ business: PlatformBusiness }>(
    `/platform/businesses/${id}/reactivate`,
  );
  return data.business;
}

export async function assignSubscription(
  businessId: string,
  planCode: string,
): Promise<Subscription> {
  const { data } = await http.put<{ subscription: Subscription }>(
    `/platform/businesses/${businessId}/subscription`,
    {
      planCode,
      months: 1,
    },
  );
  return data.subscription;
}

export async function listPlans(): Promise<{ plans: SubscriptionPlan[] }> {
  const { data } = await http.get<{ plans: SubscriptionPlan[] }>("/platform/plans");
  return data;
}

export async function updatePlan(
  id: string,
  payload: {
    priceMinor: number | null;
    graceDays: number;
    isActive: boolean;
    entitlements: Record<string, boolean | number | string>;
  },
): Promise<SubscriptionPlan> {
  const { data } = await http.patch<{ plan: SubscriptionPlan }>(`/platform/plans/${id}`, payload);
  return data.plan;
}

export async function renewSubscription(id: string): Promise<Subscription> {
  const { data } = await http.post<{ subscription: Subscription }>(
    `/platform/subscriptions/${id}/renew`,
    { months: 1 },
  );
  return data.subscription;
}

export async function grantSubscriptionGrace(id: string, days: number): Promise<Subscription> {
  const { data } = await http.post<{ subscription: Subscription }>(
    `/platform/subscriptions/${id}/grace`,
    { days },
  );
  return data.subscription;
}

export async function cancelSubscription(id: string): Promise<Subscription> {
  const { data } = await http.post<{ subscription: Subscription }>(
    `/platform/subscriptions/${id}/cancel`,
  );
  return data.subscription;
}

export async function listBillingRecords(): Promise<Paginated<BillingRecord>> {
  const { data } = await http.get<Paginated<BillingRecord>>("/platform/billing-records");
  return data;
}

export async function createBillingRecord(
  subscriptionId: string,
  payload: {
    amountMinor: number;
    periodStart: string;
    periodEnd: string;
    dueAt: string;
    reference?: string;
  },
): Promise<BillingRecord> {
  const { data } = await http.post<{ billingRecord: BillingRecord }>(
    `/platform/subscriptions/${subscriptionId}/billing-records`,
    payload,
  );
  return data.billingRecord;
}

export async function markBillingPaid(id: string, reference?: string): Promise<BillingRecord> {
  const { data } = await http.post<{ billingRecord: BillingRecord }>(
    `/platform/billing-records/${id}/mark-paid`,
    {
      reference,
    },
  );
  return data.billingRecord;
}

export async function listPlatformUsers(
  params: PlatformUserListParams = {},
): Promise<Paginated<PlatformUser>> {
  const { data } = await http.get<Paginated<PlatformUser>>("/platform/users", { params });
  return data;
}

export async function setPlatformUserActive(id: string, isActive: boolean): Promise<PlatformUser> {
  const { data } = await http.patch<{ user: PlatformUser }>(`/platform/users/${id}/status`, {
    isActive,
  });
  return data.user;
}

export async function getTenantSubscription(): Promise<{
  business: { id: string; name: string; status: string };
  subscription: Subscription | null;
}> {
  const { data } = await http.get<{
    business: { id: string; name: string; status: string };
    subscription: Subscription | null;
  }>("/tenant/subscription");
  return data;
}
