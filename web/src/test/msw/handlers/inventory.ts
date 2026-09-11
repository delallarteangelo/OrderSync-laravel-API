import { http, HttpResponse } from "msw";
import { db, randomId, findUserByToken, tokenFromAuthHeader } from "../db";
import type {
  InventoryMovement,
  ReasonCode,
  RestockEntry,
  StockAdjustment,
} from "@/shared/types/inventory";

function actor(request: Request) {
  const u = findUserByToken(tokenFromAuthHeader(request.headers.get("authorization")));
  return u ? { id: u.id, name: u.fullName } : null;
}

function recordMovement(
  productId: string,
  delta: number,
  reason: ReasonCode,
  who: { id: string; name: string },
  note?: string,
): InventoryMovement {
  const product = db.products.find((p) => p.id === productId);
  const mv: InventoryMovement = {
    id: randomId("mv"),
    productId,
    productName: product?.name ?? productId,
    delta,
    reason,
    note,
    actorId: who.id,
    actorName: who.name,
    occurredAt: new Date().toISOString(),
  };
  db.movements = [mv, ...db.movements];
  return mv;
}

export const inventoryHandlers = [
  http.get("/api/v1/inventory", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({ items: db.products });
  }),

  http.get("/api/v1/inventory/low-stock", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const items = db.products
      .filter((p) => p.isActive && p.stockOnHand <= p.lowStockThreshold)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        stockOnHand: p.stockOnHand,
        threshold: p.lowStockThreshold,
      }));
    return HttpResponse.json({ items });
  }),

  http.get("/api/v1/inventory/movements", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");
    const reason = url.searchParams.get("reason") as ReasonCode | null;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    let items = db.movements;
    if (productId) items = items.filter((m) => m.productId === productId);
    if (reason) items = items.filter((m) => m.reason === reason);
    if (from) items = items.filter((m) => m.occurredAt >= from);
    if (to) items = items.filter((m) => m.occurredAt <= to);
    return HttpResponse.json({ items });
  }),

  http.post("/api/v1/inventory/adjust", async ({ request }) => {
    const who = actor(request);
    if (!who) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const body = (await request.json()) as StockAdjustment;
    const idx = db.products.findIndex((p) => p.id === body.productId);
    if (idx === -1) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    if (body.delta < 0 && !body.note) {
      return HttpResponse.json(
        {
          code: "VALIDATION",
          message: "Note required for negative adjustment",
          fieldErrors: { note: ["Required"] },
        },
        { status: 422 },
      );
    }
    const product = db.products[idx];
    const next = Math.max(0, product.stockOnHand + body.delta);
    db.products[idx] = { ...product, stockOnHand: next };
    const mv = recordMovement(product.id, body.delta, body.reasonCode, who, body.note);
    return HttpResponse.json({ product: db.products[idx], movement: mv });
  }),

  http.post("/api/v1/inventory/restock", async ({ request }) => {
    const who = actor(request);
    if (!who) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const body = (await request.json()) as { entries: RestockEntry[] };
    const created: InventoryMovement[] = [];
    for (const entry of body.entries) {
      const idx = db.products.findIndex((p) => p.id === entry.productId);
      if (idx === -1) continue;
      const product = db.products[idx];
      db.products[idx] = { ...product, stockOnHand: product.stockOnHand + entry.quantity };
      created.push(
        recordMovement(
          product.id,
          entry.quantity,
          "RESTOCK",
          who,
          entry.note ?? (entry.supplierRef ? `Supplier: ${entry.supplierRef}` : undefined),
        ),
      );
    }
    return HttpResponse.json({ movements: created });
  }),
];
