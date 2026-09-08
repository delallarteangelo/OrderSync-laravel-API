import { describe, expect, it } from "vitest";
import {
  allowedTransitions,
  canApplyLineDiscount,
  canEditCatalog,
  canManageSettings,
  canManageUsers,
  canViewReports,
  isAdmin,
} from "../roleGuards";

describe("role guards", () => {
  it("grants tenant management only to the business owner", () => {
    expect(canEditCatalog("BUSINESS_OWNER")).toBe(true);
    expect(canManageUsers("BUSINESS_OWNER")).toBe(true);
    expect(canManageSettings("BUSINESS_OWNER")).toBe(true);
    expect(canViewReports("BUSINESS_OWNER")).toBe(true);
    expect(canApplyLineDiscount("BUSINESS_OWNER")).toBe(true);

    for (const role of ["STAFF", "CASHIER", "CUSTOMER", "SUPER_ADMIN"] as const) {
      expect(canEditCatalog(role)).toBe(false);
      expect(canManageUsers(role)).toBe(false);
    }
  });

  it("keeps platform and business administrators distinct", () => {
    expect(isAdmin("SUPER_ADMIN")).toBe(true);
    expect(isAdmin("BUSINESS_OWNER")).toBe(true);
    expect(canManageSettings("SUPER_ADMIN")).toBe(false);
  });

  it("limits cashier order transitions", () => {
    expect(allowedTransitions("BUSINESS_OWNER", "CONFIRMED")).toContain("CANCELLED");
    expect(allowedTransitions("CASHIER", "CONFIRMED")).not.toContain("CANCELLED");
    expect(allowedTransitions("CUSTOMER", "PENDING")).toEqual([]);
  });
});
