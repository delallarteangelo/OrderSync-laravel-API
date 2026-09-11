import { http, HttpResponse } from "msw";
import type {
  BillingRecord,
  PlatformBusiness,
  PlatformDashboard,
  PlatformUser,
  SubscriptionPlan,
} from "@/shared/types/platform";

const plan: SubscriptionPlan = {
  id: "plan-basic",
  code: "BASIC",
  name: "Basic",
  priceMinor: null,
  currency: "PHP",
  billingInterval: "MONTHLY",
  graceDays: 7,
  isActive: true,
  entitlements: { max_users: 2, catalog_enabled: true },
};

const business: PlatformBusiness = {
  id: "business-pending",
  name: "Pending Store",
  slug: "pending-store",
  timezone: "Asia/Manila",
  status: "PENDING",
  submittedAt: "2026-09-08T00:00:00Z",
  approvedAt: null,
  suspendedAt: null,
  suspensionReason: null,
  owner: { id: "owner-1", fullName: "Store Owner", email: "owner@example.test" },
  userCount: 1,
  subscription: null,
  createdAt: "2026-09-08T00:00:00Z",
};

const billing: BillingRecord = {
  id: "bill-1",
  businessId: business.id,
  subscriptionId: "subscription-1",
  businessName: business.name,
  amountMinor: 100000,
  currency: "PHP",
  status: "PENDING",
  periodStart: "2026-09-01T00:00:00Z",
  periodEnd: "2026-10-01T00:00:00Z",
  dueAt: "2026-09-10T00:00:00Z",
  paidAt: null,
  reference: null,
  notes: null,
};

const user: PlatformUser = {
  id: "owner-1",
  fullName: "Store Owner",
  email: "owner@example.test",
  isActive: true,
  platformRole: null,
  memberships: [
    {
      businessId: business.id,
      businessName: business.name,
      role: "BUSINESS_OWNER",
      isActive: true,
    },
  ],
  createdAt: "2026-09-08T00:00:00Z",
};

const activeSubscription = {
  id: "subscription-1",
  businessId: "business-tonette",
  status: "ACTIVE" as const,
  effectiveStatus: "ACTIVE" as const,
  startsAt: "2026-09-01T00:00:00Z",
  currentPeriodStart: "2026-09-01T00:00:00Z",
  currentPeriodEnd: "2026-10-01T00:00:00Z",
  graceEndsAt: null,
  cancelledAt: null,
  plan,
};

export const platformHandlers = [
  http.post("/api/v1/business-registrations", async ({ request }) => {
    const body = (await request.json()) as {
      businessName: string;
      ownerName: string;
      ownerEmail: string;
    };
    return HttpResponse.json(
      {
        business: {
          ...business,
          name: body.businessName,
          owner: { id: "new-owner", fullName: body.ownerName, email: body.ownerEmail },
        },
      },
      { status: 201 },
    );
  }),
  http.get("/api/v1/platform/dashboard", () =>
    HttpResponse.json<PlatformDashboard>({
      businesses: { total: 1, pending: 1, active: 0, suspended: 0 },
      subscriptions: { active: 0, grace: 0, expired: 0 },
      users: { total: 1, active: 1 },
      billing: { paidRecords: 0, paidAmountMinor: 0, currency: "PHP" },
      system: { database: "ok", checkedAt: new Date().toISOString() },
    }),
  ),
  http.get("/api/v1/tenant/subscription", () =>
    HttpResponse.json({
      business: { id: "business-tonette", name: "Tonette's Minimart", status: "ACTIVE" },
      subscription: activeSubscription,
    }),
  ),
  http.get("/api/v1/platform/businesses", () =>
    HttpResponse.json({ data: [business], meta: { currentPage: 1, lastPage: 1, total: 1 } }),
  ),
  http.post("/api/v1/platform/businesses/:id/approve", () =>
    HttpResponse.json({ business: { ...business, status: "ACTIVE" } }),
  ),
  http.get("/api/v1/platform/plans", () =>
    HttpResponse.json({ plans: [plan], entitlementDefinitions: [] }),
  ),
  http.patch("/api/v1/platform/plans/:id", async ({ request }) => {
    const body = (await request.json()) as Partial<SubscriptionPlan>;
    return HttpResponse.json({ plan: { ...plan, ...body } });
  }),
  http.get("/api/v1/platform/billing-records", () =>
    HttpResponse.json({ data: [billing], meta: { currentPage: 1, lastPage: 1, total: 1 } }),
  ),
  http.post("/api/v1/platform/billing-records/:id/mark-paid", () =>
    HttpResponse.json({ billingRecord: { ...billing, status: "PAID" } }),
  ),
  http.get("/api/v1/platform/users", () =>
    HttpResponse.json({ data: [user], meta: { currentPage: 1, lastPage: 1, total: 1 } }),
  ),
  http.patch("/api/v1/platform/users/:id/status", async ({ request }) => {
    const body = (await request.json()) as { isActive: boolean };
    return HttpResponse.json({ user: { ...user, isActive: body.isActive } });
  }),
];
