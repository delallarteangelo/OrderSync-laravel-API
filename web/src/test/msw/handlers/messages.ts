import { http, HttpResponse } from "msw";
import { db, randomId, findUserByToken, tokenFromAuthHeader } from "../db";
import type { Message, NotificationPreferences } from "@/shared/types/messaging";
import type { AiKnowledgeEntry, AiSupportSettings, SupportHandoff } from "@/shared/types/aiSupport";

const knowledge: AiKnowledgeEntry[] = [
  {
    id: "knowledge-1",
    type: "FAQ",
    title: "Pickup hours",
    question: "When can I pick up?",
    content: "Pickup is available from 9 AM to 6 PM.",
    keywords: ["pickup", "hours"],
    isActive: true,
    publishedAt: "2026-09-10T00:00:00Z",
    createdAt: "2026-09-10T00:00:00Z",
    updatedAt: "2026-09-10T00:00:00Z",
  },
];

const aiSettings: AiSupportSettings = {
  assistantEnabled: true,
  dailyCustomerRequestLimit: 20,
  monthlyBusinessRequestLimit: 500,
  maximumQuestionCharacters: 1000,
  provider: "LOCAL_GROUNDED",
  externalProviderConfigured: false,
  publicInformationOnly: false,
};

function actor(request: Request) {
  const u = findUserByToken(tokenFromAuthHeader(request.headers.get("authorization")));
  return u ? { id: u.id, name: u.fullName } : null;
}

export const messagesHandlers = [
  http.get("/api/v1/ai/knowledge", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({ items: knowledge });
  }),

  http.get("/api/v1/ai/published", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({ items: knowledge.filter((entry) => entry.isActive) });
  }),

  http.post("/api/v1/ai/knowledge", async ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const input = (await request.json()) as Partial<AiKnowledgeEntry>;
    const entry: AiKnowledgeEntry = {
      ...knowledge[0],
      ...input,
      id: randomId("knowledge"),
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    knowledge.push(entry);
    return HttpResponse.json(entry, { status: 201 });
  }),

  http.delete("/api/v1/ai/knowledge/:id", ({ params, request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const index = knowledge.findIndex((entry) => entry.id === params.id);
    if (index < 0) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    const [deleted] = knowledge.splice(index, 1);
    return HttpResponse.json({ deleted: true, id: deleted.id });
  }),

  http.get("/api/v1/ai/settings", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json(aiSettings);
  }),

  http.put("/api/v1/ai/settings", async ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    Object.assign(aiSettings, await request.json());
    return HttpResponse.json(aiSettings);
  }),

  http.get("/api/v1/ai/usage", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({
      period: "2026-09",
      provider: "LOCAL_GROUNDED",
      externalProviderConfigured: false,
      requests: 3,
      answered: 2,
      handedOff: 1,
      inputCharacters: 80,
      outputCharacters: 240,
      estimatedCostMinor: 0,
      averageLatencyMs: 4,
    });
  }),

  http.get("/api/v1/ai/handoffs", ({ request }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({ items: [] });
  }),

  http.post("/api/v1/threads/:id/assistant", async ({ request, params }) => {
    const who = actor(request);
    if (!who) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const input = (await request.json()) as { body: string };
    const sentAt = new Date().toISOString();
    const response: Message = {
      id: randomId("ai"),
      threadId: String(params.id),
      senderId: "system",
      senderName: "OrderSync AI",
      senderRole: "AI",
      kind: "AI",
      body: knowledge[0].content,
      sentAt,
      status: "sent",
      mine: false,
    };
    return HttpResponse.json(
      {
        question: {
          ...response,
          id: randomId("q"),
          senderId: who.id,
          senderName: who.name,
          senderRole: "CUSTOMER",
          kind: "HUMAN",
          body: input.body,
          mine: true,
        },
        response,
        run: {
          id: randomId("run"),
          status: "ANSWERED",
          provider: "LOCAL_GROUNDED",
          model: null,
          toolsUsed: ["tenant_knowledge"],
          inputCharacters: input.body.length,
          outputCharacters: response.body.length,
          estimatedCostMinor: 0,
          latencyMs: 2,
          reasonCode: null,
          createdAt: sentAt,
        },
        handoff: null,
      },
      { status: 201 },
    );
  }),

  http.post("/api/v1/threads/:id/handoff", ({ request, params }) => {
    if (!actor(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const handoff: SupportHandoff = {
      id: randomId("handoff"),
      threadId: String(params.id),
      customer: { id: "customer-1", name: "Customer" },
      status: "OPEN",
      reasonCode: "CUSTOMER_REQUEST",
      customerNote: null,
      requestedAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedBy: null,
    };
    return HttpResponse.json(handoff, { status: 201 });
  }),

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
