import { describe, it, expect, beforeEach } from "vitest";
import { loginAsAdmin, logout } from "@/test/utils/login";
import { finalizeSale } from "@/shared/api/pos";
import { listInventory, listMovements } from "@/shared/api/inventory";
import { isApiError } from "@/shared/api/errors";

beforeEach(() => {
  logout();
});

describe("pos api", () => {
  it("finalizes a cash sale, deducts stock, records POS_SALE movement", async () => {
    await loginAsAdmin();
    const inv = await listInventory();
    const p = inv.find((x) => x.isActive && x.stockOnHand >= 3)!;
    const stockBefore = p.stockOnHand;

    const sale = await finalizeSale({
      lines: [
        {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          unitPrice: p.price,
          quantity: 2,
        },
      ],
      paymentMethod: "CASH",
      tendered: p.price * 2 + 200,
    });

    expect(sale.id).toBeDefined();
    expect(sale.lines).toHaveLength(1);
    expect(sale.grandTotal).toBeGreaterThan(0);

    const invAfter = await listInventory();
    const after = invAfter.find((x) => x.id === p.id)!;
    expect(after.stockOnHand).toBe(stockBefore - 2);

    const movements = await listMovements({ productId: p.id });
    expect(movements[0].reason).toBe("POS_SALE");
    expect(movements[0].delta).toBe(-2);
  });

  it("rejects sale exceeding stock with INSUFFICIENT_STOCK", async () => {
    await loginAsAdmin();
    const inv = await listInventory();
    const p = inv[0];
    await expect(
      finalizeSale({
        lines: [
          {
            productId: p.id,
            name: p.name,
            sku: p.sku,
            unitPrice: p.price,
            quantity: p.stockOnHand + 9999,
          },
        ],
        paymentMethod: "CASH",
        tendered: 999_999,
      }),
    ).rejects.toSatisfy((e: unknown) => isApiError(e) && e.code === "INSUFFICIENT_STOCK");
  });
});
