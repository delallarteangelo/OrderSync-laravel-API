import { describe, it, expect, beforeEach } from "vitest";
import { loginAsAdmin, logout } from "@/test/utils/login";
import {
  getDashboard,
  getInventoryReport,
  getOrdersReport,
  getSalesReport,
} from "@/shared/api/reports";

beforeEach(() => {
  logout();
});

describe("reports api", () => {
  it("dashboard snapshot has expected shape", async () => {
    await loginAsAdmin();
    const d = await getDashboard();
    expect(d.today).toBeDefined();
    expect(Array.isArray(d.sevenDaySales)).toBe(true);
    expect(d.sevenDaySales).toHaveLength(7);
    expect(Array.isArray(d.lowStock)).toBe(true);
  });

  it("sales report aggregates by day/week/month", async () => {
    await loginAsAdmin();
    const day = await getSalesReport({ bucket: "day" });
    const week = await getSalesReport({ bucket: "week" });
    const month = await getSalesReport({ bucket: "month" });
    // monthly buckets <= weekly <= daily (with sample data)
    expect(month.length).toBeLessThanOrEqual(week.length);
    expect(week.length).toBeLessThanOrEqual(day.length);
  });

  it("orders report rows sum to total per bucket", async () => {
    await loginAsAdmin();
    const rows = await getOrdersReport({ bucket: "day" });
    for (const r of rows) {
      const sum =
        r.pending + r.confirmed + r.preparing + r.readyForPickup + r.completed + r.rejected + r.cancelled;
      expect(sum).toBe(r.total);
    }
  });

  it("inventory report classifies OK/LOW/OUT", async () => {
    await loginAsAdmin();
    const rows = await getInventoryReport();
    for (const r of rows) {
      const expected =
        r.stockOnHand === 0 ? "OUT" : r.stockOnHand <= r.threshold ? "LOW" : "OK";
      expect(r.status).toBe(expected);
    }
  });
});
