import { describe, expect, it } from "vitest";
import { isPublicCatalogPath } from "@/shared/pwa/pwa";

describe("PWA cache allowlist", () => {
  it("allows only public storefront reads", () => {
    expect(isPublicCatalogPath("/api/v1/storefronts")).toBe(true);
    expect(isPublicCatalogPath("/api/v1/storefronts/store-a")).toBe(true);
    expect(isPublicCatalogPath("/api/v1/customer/orders")).toBe(false);
    expect(isPublicCatalogPath("/api/v1/threads/1/messages")).toBe(false);
    expect(isPublicCatalogPath("/api/v1/payments/1/proof")).toBe(false);
  });
});
