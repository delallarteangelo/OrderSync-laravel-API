import { http, HttpResponse } from "msw";
import { db, randomId, findUserByToken, tokenFromAuthHeader } from "../db";
import type { CartLine, PosSale, PaymentMethod } from "@/shared/types/pos";

function actor(request: Request) {
  const u = findUserByToken(tokenFromAuthHeader(request.headers.get("authorization")));
  return u ? { id: u.id, name: u.fullName } : null;
}

export const posHandlers = [
  http.get("/api/v1/pos/sales", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({ items: db.posSales });
  }),

  http.post("/api/v1/pos/sales", async ({ request }) => {
    const who = actor(request);
    if (!who) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const body = (await request.json()) as {
      lines: CartLine[];
      paymentMethod: PaymentMethod;
      tendered?: number;
      discountTotal?: number;
    };

    // Validate stock
    const insufficient = body.lines.filter((l) => {
      const p = db.products.find((x) => x.id === l.productId);
      return !p || !p.isActive || p.stockOnHand < l.quantity;
    });
    if (insufficient.length) {
      return HttpResponse.json(
        {
          code: "INSUFFICIENT_STOCK",
          message: "One or more items have insufficient stock",
          fieldErrors: { lines: insufficient.map((l) => `${l.name} (need ${l.quantity})`) },
        },
        { status: 409 },
      );
    }

    const subtotal = body.lines.reduce((a, l) => a + l.unitPrice * l.quantity - (l.lineDiscount ?? 0), 0);
    const discountTotal = body.discountTotal ?? 0;
    const taxRate = db.settings.taxRate ?? 0;
    const taxTotal = Math.round((subtotal - discountTotal) * (taxRate / 100) * 100) / 100;
    const grandTotal = subtotal - discountTotal + taxTotal;
    const change = body.paymentMethod === "CASH" && body.tendered != null ? Math.max(0, body.tendered - grandTotal) : undefined;

    const sale: PosSale = {
      id: randomId("sale"),
      code: `S-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`,
      lines: body.lines,
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      paymentMethod: body.paymentMethod,
      tendered: body.tendered,
      change,
      cashierId: who.id,
      cashierName: who.name,
      completedAt: new Date().toISOString(),
      receiptNumber: `R-${Date.now().toString().slice(-8)}`,
    };

    // Deduct stock + movements
    for (const l of body.lines) {
      const pi = db.products.findIndex((p) => p.id === l.productId);
      if (pi !== -1) {
        db.products[pi] = { ...db.products[pi], stockOnHand: db.products[pi].stockOnHand - l.quantity };
        db.movements = [
          {
            id: randomId("mv"),
            productId: l.productId,
            productName: l.name,
            delta: -l.quantity,
            reason: "POS_SALE",
            note: `Sale ${sale.receiptNumber}`,
            actorId: who.id,
            actorName: who.name,
            occurredAt: sale.completedAt,
          },
          ...db.movements,
        ];
      }
    }
    db.posSales = [sale, ...db.posSales];
    return HttpResponse.json(sale, { status: 201 });
  }),
];
