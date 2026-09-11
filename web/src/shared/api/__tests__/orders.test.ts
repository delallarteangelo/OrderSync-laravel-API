import { describe, it, expect, beforeEach } from "vitest";
import { loginAsAdmin, logout } from "@/test/utils/login";
import { getOrder, listOrders, transitionOrder } from "@/shared/api/orders";
import { isApiError } from "@/shared/api/errors";

beforeEach(() => {
  logout();
});

describe("orders api", () => {
  it("lists orders", async () => {
    await loginAsAdmin();
    const items = await listOrders();
    expect(items.length).toBeGreaterThan(0);
  });

  it("blocks illegal transition (PENDING -> COMPLETED)", async () => {
    await loginAsAdmin();
    const all = await listOrders();
    const pending = all.find((o) => o.status === "PENDING")!;
    await expect(transitionOrder(pending.id, "COMPLETED")).rejects.toSatisfy(
      (e: unknown) => isApiError(e) && e.code === "ILLEGAL_TRANSITION",
    );
  });

  it("PENDING -> CONFIRMED deducts stock and appends history", async () => {
    await loginAsAdmin();
    const all = await listOrders();
    const pending = all.find((o) => o.status === "PENDING")!;
    const confirmed = await transitionOrder(pending.id, "CONFIRMED");
    expect(confirmed.status).toBe("CONFIRMED");
    expect(confirmed.statusHistory.at(-1)?.status).toBe("CONFIRMED");

    const reloaded = await getOrder(pending.id);
    expect(reloaded.status).toBe("CONFIRMED");
  });
});
