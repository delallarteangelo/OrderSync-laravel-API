import { describe, it, expect, beforeEach } from "vitest";
import { loginAsAdmin, logout } from "@/test/utils/login";
import { adjustStock, listInventory, listMovements, restock } from "@/shared/api/inventory";
import { isApiError } from "@/shared/api/errors";

beforeEach(() => {
  logout();
});

describe("inventory api", () => {
  it("requires note for negative adjustment", async () => {
    await loginAsAdmin();
    const items = await listInventory();
    const p = items[0];
    await expect(
      adjustStock({ productId: p.id, delta: -1, reasonCode: "ADJUSTMENT" }),
    ).rejects.toSatisfy((e: unknown) => isApiError(e) && !!e.fieldErrors?.note);
  });

  it("adjusts stock and records movement", async () => {
    await loginAsAdmin();
    const items = await listInventory();
    const p = items[0];
    const before = p.stockOnHand;
    const result = await adjustStock({
      productId: p.id,
      delta: 5,
      reasonCode: "ADJUSTMENT",
    });
    expect(result.product.stockOnHand).toBe(before + 5);
    const movements = await listMovements({ productId: p.id });
    expect(movements[0].delta).toBe(5);
  });

  it("restocks multiple items", async () => {
    await loginAsAdmin();
    const items = await listInventory();
    const result = await restock([
      { productId: items[0].id, quantity: 10 },
      { productId: items[1].id, quantity: 20 },
    ]);
    expect(result.movements).toHaveLength(2);
    expect(result.movements.every((m) => m.reason === "RESTOCK")).toBe(true);
  });
});
