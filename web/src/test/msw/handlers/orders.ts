import { http, HttpResponse } from "msw";
import { db, randomId, findUserByToken, tokenFromAuthHeader } from "../db";
import type { Order, OrderStatus, OrderStatusEvent } from "@/shared/types/orders";

const LEGAL_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

function actor(request: Request) {
  const u = findUserByToken(tokenFromAuthHeader(request.headers.get("authorization")));
  return u ? { id: u.id, name: u.fullName, role: u.role } : null;
}

function appendEvent(order: Order, next: OrderStatus, who: { name: string }, note?: string): Order {
  const ev: OrderStatusEvent = { status: next, at: new Date().toISOString(), actorName: who.name, note };
  return { ...order, status: next, updatedAt: ev.at, statusHistory: [...order.statusHistory, ev] };
}

export const ordersHandlers = [
  http.get("/api/v1/orders", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search")?.toLowerCase();
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    let items = db.orders;
    if (status) items = items.filter((o) => o.status === status);
    if (search) items = items.filter((o) => o.code.toLowerCase().includes(search) || o.customer.name.toLowerCase().includes(search));
    if (from) items = items.filter((o) => o.placedAt >= from);
    if (to) items = items.filter((o) => o.placedAt <= to);
    return HttpResponse.json({ items });
  }),

  http.get("/api/v1/orders/:id", ({ request, params }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const o = db.orders.find((x) => x.id === params.id);
    if (!o) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    return HttpResponse.json(o);
  }),

  http.post("/api/v1/orders/:id/transition", async ({ request, params }) => {
    const who = actor(request);
    if (!who) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const body = (await request.json()) as { next: OrderStatus; note?: string };
    const idx = db.orders.findIndex((o) => o.id === params.id);
    if (idx === -1) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    const order = db.orders[idx];
    if (!LEGAL_TRANSITIONS[order.status].includes(body.next)) {
      return HttpResponse.json(
        { code: "ILLEGAL_TRANSITION", message: `Cannot move from ${order.status} to ${body.next}` },
        { status: 409 },
      );
    }
    // Confirm → deduct stock atomically
    if (body.next === "CONFIRMED") {
      const insufficient = order.items.filter((it) => {
        const p = db.products.find((x) => x.id === it.productId);
        return !p || !p.isActive || p.stockOnHand < it.quantity;
      });
      if (insufficient.length) {
        return HttpResponse.json(
          {
            code: "INSUFFICIENT_STOCK",
            message: "One or more items have insufficient stock",
            fieldErrors: { items: insufficient.map((i) => `${i.productName} (need ${i.quantity})`) },
          },
          { status: 409 },
        );
      }
      // Apply deductions + movements
      for (const it of order.items) {
        const pi = db.products.findIndex((p) => p.id === it.productId);
        if (pi !== -1) {
          db.products[pi] = { ...db.products[pi], stockOnHand: db.products[pi].stockOnHand - it.quantity };
          db.movements = [
            {
              id: randomId("mv"),
              productId: it.productId,
              productName: it.productName,
              delta: -it.quantity,
              reason: "ORDER_CONFIRMED",
              note: `Order ${order.code}`,
              actorId: who.id,
              actorName: who.name,
              occurredAt: new Date().toISOString(),
            },
            ...db.movements,
          ];
        }
      }
    }
    db.orders[idx] = appendEvent(order, body.next, who, body.note);
    return HttpResponse.json(db.orders[idx]);
  }),
];
