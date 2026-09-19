import { describe, expect, it } from "vitest";
import {
  approveBusiness,
  getPlatformDashboard,
  getTenantSubscription,
  listBillingRecords,
  listPlans,
  listPlatformBusinesses,
  listPlatformUsers,
  markBillingPaid,
  setPlatformUserActive,
  updatePlan,
} from "@/shared/api/platform";
import { registerBusiness } from "@/shared/api/registration";

describe("platform administration api", () => {
  it("returns only the current tenant subscription summary", async () => {
    const result = await getTenantSubscription();
    expect(result.business.id).toBe("business-tonette");
    expect(result.subscription?.plan.code).toBe("BASIC");
  });

  it("submits a business registration for approval", async () => {
    const { business } = await registerBusiness({
      businessName: "New Store",
      ownerName: "New Owner",
      ownerEmail: "new@example.test",
      password: "Registration123",
      timezone: "Asia/Manila",
    });
    expect(business.status).toBe("PENDING");
    expect(business.owner?.email).toBe("new@example.test");
  });

  it("loads dashboard and pending businesses", async () => {
    expect((await getPlatformDashboard()).businesses.pending).toBe(1);
    const businesses = await listPlatformBusinesses();
    expect(businesses.data[0].status).toBe("PENDING");
    expect((await approveBusiness(businesses.data[0].id)).status).toBe("ACTIVE");
  });

  it("reads and configures fixed subscription plans", async () => {
    const { plans } = await listPlans();
    const updated = await updatePlan(plans[0].id, {
      priceMinor: 99000,
      graceDays: 10,
      isActive: true,
      entitlements: { ...plans[0].entitlements, max_users: 4 },
    });
    expect(updated.code).toBe("BASIC");
    expect(updated.priceMinor).toBe(99000);
    expect(updated.entitlements.max_users).toBe(4);
  });

  it("marks an internal billing record paid", async () => {
    const records = await listBillingRecords();
    expect(records.data[0].status).toBe("PENDING");
    expect((await markBillingPaid(records.data[0].id, "MANUAL-1")).status).toBe("PAID");
  });

  it("updates a platform user's active state", async () => {
    const users = await listPlatformUsers();
    expect((await setPlatformUserActive(users.data[0].id, false)).isActive).toBe(false);
  });
});
