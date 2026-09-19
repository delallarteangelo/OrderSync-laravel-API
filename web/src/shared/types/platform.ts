export type BusinessStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";
export type SubscriptionStatus = "ACTIVE" | "GRACE" | "EXPIRED" | "CANCELLED";
export type BillingStatus = "PENDING" | "PAID" | "OVERDUE" | "VOID";
export type PlanCode = "BASIC" | "STANDARD" | "PREMIUM";

export type SubscriptionPlan = {
  id: string;
  code: PlanCode;
  name: string;
  priceMinor: number | null;
  currency: "PHP";
  billingInterval: "MONTHLY";
  graceDays: number;
  isActive: boolean;
  entitlements: Record<string, boolean | number | string>;
};

export type Subscription = {
  id: string;
  businessId: string;
  status: SubscriptionStatus;
  effectiveStatus: SubscriptionStatus;
  startsAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  graceEndsAt: string | null;
  cancelledAt: string | null;
  plan: SubscriptionPlan;
};

export type PlatformBusiness = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: BusinessStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
  owner: { id: string; fullName: string; email: string } | null;
  userCount: number;
  subscription: Subscription | null;
  createdAt: string;
};

export type BillingRecord = {
  id: string;
  businessId: string;
  subscriptionId: string;
  subscriptionRequestId?: string | null;
  businessName: string | null;
  amountMinor: number;
  currency: "PHP";
  status: BillingStatus;
  periodStart: string;
  periodEnd: string;
  dueAt: string;
  paidAt: string | null;
  reference: string | null;
  notes: string | null;
};

export type PlatformUser = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  platformRole: "SUPER_ADMIN" | null;
  memberships: Array<{ businessId: string; businessName: string; role: string; isActive: boolean }>;
  createdAt: string;
};

export type PlatformDashboard = {
  businesses: { total: number; pending: number; active: number; suspended: number };
  subscriptions: { active: number; grace: number; expired: number };
  users: { total: number; active: number };
  billing: { paidRecords: number; paidAmountMinor: number; currency: "PHP" };
  system: { database: "ok"; checkedAt: string };
};

export type Paginated<T> = {
  data: T[];
  meta: { currentPage: number; lastPage: number; perPage?: number; total: number };
};
