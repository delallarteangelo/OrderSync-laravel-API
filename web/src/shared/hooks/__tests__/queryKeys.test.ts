import { describe, expect, it } from "vitest";
import { tenantQk } from "../useApi";

describe("tenant query keys", () => {
  it("keeps catalog and inventory caches isolated by business", () => {
    expect(tenantQk.products("business-a")).not.toEqual(tenantQk.products("business-b"));
    expect(tenantQk.inventory("business-a")).not.toEqual(tenantQk.inventory("business-b"));
    expect(tenantQk.movements("business-a")).toEqual(["tenant", "business-a", "movements", {}]);
  });
});
