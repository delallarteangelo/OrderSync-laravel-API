import { http, HttpResponse } from "msw";
import { db, randomId, findUserByToken, tokenFromAuthHeader } from "../db";
import type { Message, NotificationPreferences } from "@/shared/types/messaging";

function actor(request: Request) {
  const u = findUserByToken(tokenFromAuthHeader(request.headers.get("authorization")));
  return u ? { id: u.id, name: u.fullName } : null;
}

export const messagesHandlers = [
  http.get("/api/v1/threads", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({ items: db.threads });
  }),

  http.get("/api/v1/threads/:id/messages", ({ request, params }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const items = db.messages[String(params.id)] ?? [];
    return HttpResponse.json({ items });
  }),

  http.post("/api/v1/threads/:id/messages", async ({ request, params }) => {
    const who = actor(request);
    if (!who) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const body = (await request.json()) as { body: string };
    const threadId = String(params.id);
    const msg: Message = {
      id: randomId("m"),
      threadId,
      senderId: who.id,
      senderName: who.name,
      senderRole: "CASHIER",
      kind: "HUMAN",
      body: body.body,
      sentAt: new Date().toISOString(),
      status: "sent",
      mine: true,
    };
    db.messages[threadId] = [...(db.messages[threadId] ?? []), msg];
    const tIdx = db.threads.findIndex((t) => t.id === threadId);
    if (tIdx !== -1) {
      db.threads[tIdx] = {
        ...db.threads[tIdx],
        lastMessage: body.body,
        lastMessageAt: msg.sentAt,
        unreadCount: 0,
      };
    }
    return HttpResponse.json(msg, { status: 201 });
  }),

  http.post("/api/v1/threads/:id/read", ({ request, params }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const idx = db.threads.findIndex((t) => t.id === params.id);
    if (idx !== -1) db.threads[idx] = { ...db.threads[idx], unreadCount: 0 };
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/v1/notifications", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({
      items: db.notifications,
      unreadCount: db.notifications.filter((item) => item.readAt === null).length,
    });
  }),

  http.post("/api/v1/notifications/read-all", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const now = new Date().toISOString();
    db.notifications = db.notifications.map((item) => ({ ...item, readAt: item.readAt ?? now }));
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/v1/notifications/:id/read", ({ request, params }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const index = db.notifications.findIndex((item) => item.id === params.id);
    if (index === -1) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    db.notifications[index] = {
      ...db.notifications[index],
      readAt: db.notifications[index].readAt ?? new Date().toISOString(),
    };
    return HttpResponse.json(db.notifications[index]);
  }),

  http.get("/api/v1/notification-preferences", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json(db.notificationPreferences);
  }),

  http.put("/api/v1/notification-preferences", async ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    db.notificationPreferences = (await request.json()) as NotificationPreferences;
    return HttpResponse.json(db.notificationPreferences);
  }),

  http.get("/api/v1/events", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const after = new URL(request.url).searchParams.get("after") ?? "0";
    const items = db.realtimeEvents.filter((item) => Number(item.id) > Number(after));
    return HttpResponse.json({
      items,
      cursor: db.realtimeEvents.at(-1)?.id ?? after,
      transport: "POLLING",
    });
  }),
];
