import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelCustomerOrder,
  getStorefront,
  listCustomerOrders,
  listStorefronts,
  placeCustomerOrder,
} from "@/shared/api/orders";
import { loginAsCustomer, logout } from "@/test/utils/login";

beforeEach(() => logout());

describe("customer storefront api", () => {
  it("loads a tenant-branded public catalog", async () => {
    const stores = await listStorefronts();
    expect(stores[0]).toMatchObject({ slug: "tonettes-minimart", fulfillmentMethod: "PICKUP" });
    const storefront = await getStorefront(stores[0].slug);
    expect(storefront.business.id).toBe(stores[0].id);
    expect(storefront.products.length).toBeGreaterThan(0);
  });

  it("places and cancels only the signed-in customer's pending order", async () => {
    await loginAsCustomer();
    const storefront = await getStorefront("tonettes-minimart");
    const product = storefront.products.find((item) => item.stockOnHand > 0)!;
    const order = await placeCustomerOrder({
      items: [{ productId: product.id, quantity: 1 }],
      idempotencyKey: crypto.randomUUID(),
    });
    expect(order.status).toBe("PENDING");
    expect((await listCustomerOrders()).map((item) => item.id)).toContain(order.id);
    expect((await cancelCustomerOrder(order.id)).status).toBe("CANCELLED");
  });
});
