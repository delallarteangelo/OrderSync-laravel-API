import { http, HttpResponse } from "msw";
import { db, randomId, findUserByToken, tokenFromAuthHeader } from "../db";
import type { Message } from "@/shared/types/messaging";

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
      body: body.body,
      sentAt: new Date().toISOString(),
      status: "sent",
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
];
