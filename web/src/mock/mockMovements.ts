import type { InventoryMovement, ReasonCode } from "@/shared/types/inventory";
import { mockProducts } from "./mockProducts";
import { isoDaysAgo, isoHoursAgo } from "@/shared/lib/dates";

const reasons: ReasonCode[] = ["POS_SALE", "ORDER_CONFIRMED", "ADJUSTMENT", "RESTOCK"];

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeMovements(): InventoryMovement[] {
  // Deterministic-ish set so the demo looks alive but stable per session.
  const rows: InventoryMovement[] = [];
  for (let i = 0; i < 44; i++) {
    const p = mockProducts[i % mockProducts.length];
    const reason = reasons[i % reasons.length];
    const dayBack = Math.floor(i / 2);
    const delta =
      reason === "RESTOCK"
        ? 12 + (i % 18)
        : reason === "ADJUSTMENT"
          ? (i % 3 === 0 ? -1 : 1) * (1 + (i % 5))
          : -(1 + (i % 4));
    rows.push({
      id: `mv-${1000 + i}`,
      productId: p.id,
      productName: p.name,
      delta,
      reason,
      note:
        reason === "ADJUSTMENT"
          ? delta < 0
            ? "Expired stock removed"
            : "Recount correction"
          : reason === "RESTOCK"
            ? "Delivery — supplier A"
            : undefined,
      actorId: i % 3 === 0 ? "u-admin-1" : "u-cash-1",
      actorName: i % 3 === 0 ? "Tonette Reyes" : "Maria Santos",
      occurredAt: i % 4 === 0 ? isoHoursAgo(dayBack + 2) : isoDaysAgo(dayBack),
    });
  }
  return rows.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export const mockMovements: InventoryMovement[] = makeMovements();
