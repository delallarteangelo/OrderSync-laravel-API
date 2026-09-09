import { beforeEach, describe, expect, it } from "vitest";
import { useStorefrontCartStore } from "../storefrontCartStore";

beforeEach(() => {
  sessionStorage.clear();
  useStorefrontCartStore.setState({ businessSlug: null, lines: [] });
});

describe("storefront cart", () => {
  it("keeps a same-store draft and clears it on a store change", () => {
    useStorefrontCartStore.getState().setBusiness("store-a");
    useStorefrontCartStore.setState({
      lines: [{ productId: "a", name: "Product A", unitPrice: 10, quantity: 1, stockOnHand: 2 }],
    });
    useStorefrontCartStore.getState().setBusiness("store-a");
    expect(useStorefrontCartStore.getState().lines).toHaveLength(1);
    useStorefrontCartStore.getState().setBusiness("store-b");
    expect(useStorefrontCartStore.getState().lines).toEqual([]);
  });
});
