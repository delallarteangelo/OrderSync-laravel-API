import { describe, expect, it } from "vitest";
import { qk, tenantQk } from "../useApi";

describe("tenant query keys", () => {
  it("keeps catalog and inventory caches isolated by business", () => {
    expect(tenantQk.products("business-a")).not.toEqual(tenantQk.products("business-b"));
    expect(tenantQk.inventory("business-a")).not.toEqual(tenantQk.inventory("business-b"));
    expect(tenantQk.sales("business-a")).not.toEqual(tenantQk.sales("business-b"));
    expect(tenantQk.orders("business-a")).not.toEqual(tenantQk.orders("business-b"));
    expect(tenantQk.movements("business-a")).toEqual(["tenant", "business-a", "movements", {}]);
    expect(qk.dashboard("business-a")).not.toEqual(qk.dashboard("business-b"));
    expect(qk.reportSales("business-a")).not.toEqual(qk.reportSales("business-b"));
    expect(qk.reportOrders("business-a")).not.toEqual(qk.reportOrders("business-b"));
    expect(qk.reportInventory("business-a")).not.toEqual(qk.reportInventory("business-b"));
    expect(qk.reportOverview("business-a")).not.toEqual(qk.reportOverview("business-b"));
  });
});
