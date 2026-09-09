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
  const ev: OrderStatusEvent = {
    status: next,
    at: new Date().toISOString(),
    actorName: who.name,
    note,
  };
  return { ...order, status: next, updatedAt: ev.at, statusHistory: [...order.statusHistory, ev] };
}

export const ordersHandlers = [
  http.get("/api/v1/storefronts", () =>
    HttpResponse.json({
      items: [
        {
          id: "business-tonette",
          name: "Tonette's Minimart",
          slug: "tonettes-minimart",
          timezone: "Asia/Manila",
          fulfillmentMethod: "PICKUP",
        },
      ],
    }),
  ),

  http.get("/api/v1/storefronts/:slug", ({ params }) => {
    if (params.slug !== "tonettes-minimart") {
      return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    }
    return HttpResponse.json({
      business: {
        id: "business-tonette",
        name: "Tonette's Minimart",
        slug: "tonettes-minimart",
        timezone: "Asia/Manila",
        fulfillmentMethod: "PICKUP",
      },
      categories: db.categories.map((category) => ({ id: category.id, name: category.name })),
      products: db.products
        .filter((product) => product.isActive)
        .map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description ?? null,
          categoryId: product.categoryId,
          categoryName:
            db.categories.find((category) => category.id === product.categoryId)?.name ?? "",
          price: product.price,
          stockOnHand: product.stockOnHand,
          imageUrl: product.imageUrl ?? null,
        })),
    });
  }),

  http.get("/api/v1/customer/orders", ({ request }) => {
    const who = actor(request);
    if (!who || who.role !== "CUSTOMER")
      return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({ items: db.orders.filter((order) => order.customer.id === who.id) });
  }),

  http.post("/api/v1/customer/orders", async ({ request }) => {
    const who = actor(request);
    if (!who || who.role !== "CUSTOMER")
      return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    if (!request.headers.get("Idempotency-Key")) {
      return HttpResponse.json(
        { code: "VALIDATION_FAILED", message: "Idempotency-Key is required" },
        { status: 422 },
      );
    }
    const body = (await request.json()) as { items: { productId: string; quantity: number }[] };
    const products = body.items.map((item) => ({
      item,
      product: db.products.find((product) => product.id === item.productId),
    }));
    const invalid = products.find(
      ({ item, product }) => !product?.isActive || (product?.stockOnHand ?? 0) < item.quantity,
    );
    if (invalid) {
      return HttpResponse.json(
        {
          code: "INSUFFICIENT_STOCK",
          message: "One or more items are unavailable",
          fieldErrors: { items: [invalid.item.productId] },
        },
        { status: 409 },
      );
    }
    const items = products.map(({ item, product }) => ({
      productId: product!.id,
      sku: product!.sku,
      productName: product!.name,
      quantity: item.quantity,
      unitPrice: product!.price,
      lineTotal: product!.price * item.quantity,
    }));
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const now = new Date().toISOString();
    const order: Order = {
      id: randomId("order"),
      code: `ORD-${Date.now()}`,
      business: { id: "business-tonette", name: "Tonette's Minimart", slug: "tonettes-minimart" },
      customer: { id: who.id, name: who.name, email: "customer@ordersync.local" },
      items,
      subtotal: total,
      total,
      fulfillmentMethod: "PICKUP",
      status: "PENDING",
      placedAt: now,
      updatedAt: now,
      statusHistory: [{ status: "PENDING", at: now, actorName: who.name }],
    };
    db.orders = [order, ...db.orders];
    return HttpResponse.json(order, { status: 201 });
  }),

  http.post("/api/v1/customer/orders/:id/cancel", ({ request, params }) => {
    const who = actor(request);
    if (!who || who.role !== "CUSTOMER")
      return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const index = db.orders.findIndex(
      (order) => order.id === params.id && order.customer.id === who.id,
    );
    if (index === -1) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    if (db.orders[index].status !== "PENDING") {
      return HttpResponse.json(
        { code: "CANCELLATION_NOT_ALLOWED", message: "Only pending orders can be cancelled" },
        { status: 409 },
      );
    }
    db.orders[index] = appendEvent(db.orders[index], "CANCELLED", who, "Cancelled by customer");
    return HttpResponse.json(db.orders[index]);
  }),

  http.get("/api/v1/orders", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search")?.toLowerCase();
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    let items = db.orders;
    if (status) items = items.filter((o) => o.status === status);
    if (search)
      items = items.filter(
        (o) =>
          o.code.toLowerCase().includes(search) || o.customer.name.toLowerCase().includes(search),
      );
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
            fieldErrors: {
              items: insufficient.map((i) => `${i.productName} (need ${i.quantity})`),
            },
          },
          { status: 409 },
        );
      }
      // Apply deductions + movements
      for (const it of order.items) {
        const pi = db.products.findIndex((p) => p.id === it.productId);
        if (pi !== -1) {
          db.products[pi] = {
            ...db.products[pi],
            stockOnHand: db.products[pi].stockOnHand - it.quantity,
          };
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
