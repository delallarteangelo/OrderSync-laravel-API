import { beforeEach, describe, expect, it } from "vitest";
import { useStorefrontCartStore } from "../storefrontCartStore";

beforeEach(() => {
  localStorage.clear();
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

  it("persists only the customer cart draft on this device", () => {
    useStorefrontCartStore.getState().setBusiness("store-a");
    useStorefrontCartStore.getState().add({
      id: "product-1",
      name: "Rice",
      description: null,
      categoryId: "category-1",
      categoryName: "Pantry",
      price: 55,
      stockOnHand: 4,
      imageUrl: null,
    });

    const persisted = JSON.parse(localStorage.getItem("storefront-cart-draft") ?? "{}");
    expect(persisted.state.businessSlug).toBe("store-a");
    expect(persisted.state.lines).toHaveLength(1);
    expect(persisted.state).not.toHaveProperty("setBusiness");
  });
});
