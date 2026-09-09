import { describe, expect, it } from "vitest";
import {
  allowedTransitions,
  canAdjustInventory,
  canApplyLineDiscount,
  canEditCatalog,
  canManageSettings,
  canManageUsers,
  canViewReports,
  isAdmin,
} from "../roleGuards";

describe("role guards", () => {
  it("grants catalog and inventory operations to owners and staff", () => {
    expect(canEditCatalog("BUSINESS_OWNER")).toBe(true);
    expect(canEditCatalog("STAFF")).toBe(true);
    expect(canAdjustInventory("BUSINESS_OWNER")).toBe(true);
    expect(canAdjustInventory("STAFF")).toBe(true);
    expect(canAdjustInventory("CASHIER")).toBe(false);
    expect(canManageUsers("BUSINESS_OWNER")).toBe(true);
    expect(canManageSettings("BUSINESS_OWNER")).toBe(true);
    expect(canViewReports("BUSINESS_OWNER")).toBe(true);
    expect(canApplyLineDiscount("BUSINESS_OWNER")).toBe(true);

    for (const role of ["CASHIER", "CUSTOMER", "SUPER_ADMIN"] as const) {
      expect(canEditCatalog(role)).toBe(false);
      expect(canManageUsers(role)).toBe(false);
    }
    expect(canManageUsers("STAFF")).toBe(false);
  });

  it("keeps platform and business administrators distinct", () => {
    expect(isAdmin("SUPER_ADMIN")).toBe(true);
    expect(isAdmin("BUSINESS_OWNER")).toBe(true);
    expect(canManageSettings("SUPER_ADMIN")).toBe(false);
  });

  it("limits business roles to the pickup pipeline", () => {
    expect(allowedTransitions("BUSINESS_OWNER", "CONFIRMED")).toEqual(["PREPARING"]);
    expect(allowedTransitions("CASHIER", "CONFIRMED")).toEqual(["PREPARING"]);
    expect(allowedTransitions("STAFF", "PENDING")).toEqual(["CONFIRMED", "REJECTED"]);
    expect(allowedTransitions("CUSTOMER", "PENDING")).toEqual([]);
  });
});
